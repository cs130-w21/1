import { ClientHttp2Session, connect } from 'http2'
import { EventEmitter } from 'events'
import { JobOrderer } from './JobOrderer'
import { Job } from './Job'

/**
 * A Junknet client. It distributes the given jobs among daemons it knows about.
 *
 * @remarks
 * Events:
 * - `'error'(Error)`: network-related failure
 * - `'progress'({@link Job}, string)`: a finished job resulted in the given data
 * - `'done'()`: all jobs completed
 *
 * @experimental
 */
export default class Client extends EventEmitter {
	private jobOrderer: JobOrderer
	private availableDaemons: Set<ClientHttp2Session> = new Set()

	/**
	 * Create a client whose responsibility is to finish the given jobs.
	 * It won't start until it knows about some daemons.
	 *
	 * @param jobs - array of the jobs in any order
	 */
	constructor(jobs: Job[]) {
		super()
		this.jobOrderer = new JobOrderer(jobs)
	}

	/**
	 * String representation of the host and port together.
	 *
	 * @remarks
	 * Needed because IPv6 addresses must be bracketed to disambiguate colons.
	 *
	 * @param host - hostname or IP address
	 * @param port - port number
	 * @returns connection string suitable for a URL
	 */
	private static hostAndPort(host: string, port: number): string {
		const seg = host.indexOf(':') < 0 ? host : `[${host}]`
		return `${seg}:${port}`
	}

	/**
	 * Add a new daemon to the swarm.
	 * The client may now give jobs to this daemon.
	 *
	 * @param host - hostname or IP address of daemon
	 * @param port - port number of daemon on the host
	 */
	public introduce(host: string, port: number): void {
		const client = connect(`http://${Client.hostAndPort(host, port)}`)
		client.on('error', (err) => this.emit('error', err))
		this.setAvailable(client)
	}

	/**
	 * Mark a daemon as available.
	 *
	 * @param daemon - The daemon that is available.
	 */
	private setAvailable(daemon: ClientHttp2Session): void {
		this.availableDaemons.add(daemon)
		this.checkJobsAndAssign()
	}

	/**
	 * Tries to assign the next available job to a daemon.
	 * Closes all daemons if all jobs are finished.
	 */
	private checkJobsAndAssign(): void {
		const job = this.jobOrderer.popNextJob()

		if (job && this.availableDaemons.size > 0) {
			const daemon = Array.from(this.availableDaemons.values())[0]
			if (daemon) {
				this.assignJobToDaemon(job, daemon)
			} else {
				throw 'skjdfhsadkfl'
			}
		} else if (this.jobOrderer.isDone()) {
			this.closeAllDaemonsAndFinish()
		}
	}

	/**
	 * Closes all daemons.
	 * Emits 'done' once all daemons are closed.
	 */
	private closeAllDaemonsAndFinish() {
		this.availableDaemons.forEach((daemon) =>
			daemon.close(() => {
				this.availableDaemons.delete(daemon)
				if (this.availableDaemons.size == 0) {
					this.emit('done')
				}
			}),
		)
	}

	/**
	 * Asksthe daemon to work on the job.
	 * Sends HTTP request and handles response.
	 *
	 * @param job - The job to assign.
	 * @param daemon - The daemon to which to assign the job.
	 */
	private assignJobToDaemon(job: Job, daemon: ClientHttp2Session) {
		const request = daemon.request({ ':path': `/${job.name}` })
		daemon.on('error', (err) => this.emit('error', err))

		let data = ''
		request.setEncoding('utf8')
		request.on('data', (chunk) => (data += chunk))

		request.on('end', () => {
			if (data == 'failed') {
				this.jobOrderer.reportFailedJob(job)
			} else {
				this.jobOrderer.reportCompletedJob(job)
			}

			this.emit('progress', job, data)
			this.setAvailable(daemon)
			this.checkJobsAndAssign()
		})
	}
}
