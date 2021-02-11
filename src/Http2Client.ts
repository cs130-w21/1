import { ClientHttp2Session, connect } from 'http2'
import { EventEmitter } from 'events'
import { strict as assert } from 'assert'
import { Client } from './Client'
import { JobOrderer } from './JobOrderer'
import { Job } from './Job'

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
function hostAndPort(host: string, port: number): string {
	const seg = host.indexOf(':') < 0 ? host : `[${host}]`
	return `${seg}:${port}`
}

/**
 * A mock Junknet client using HTTP/2.
 * It distributes the given jobs among daemons it knows about.
 */
export class Http2Client extends EventEmitter implements Client {
	private readonly availableDaemons: Set<ClientHttp2Session> = new Set()

	/**
	 * Create a client whose responsibility is to finish jobs.
	 * It won't start until it knows about some daemons.
	 *
	 * @param jobOrderer - A JobOrderer managing the Jobs to complete.
	 */
	constructor(private jobOrderer: JobOrderer) {
		super()
	}

	/**
	 * Add a new daemon to the swarm.
	 * The client may now give jobs to this daemon.
	 *
	 * @param host - hostname or IP address of daemon
	 * @param port - port number of daemon on the host
	 */
	public introduce(host: string, port: number): void {
		const client = connect(`http://${hostAndPort(host, port)}`)
		client.on('error', (err) => this.emit('error', err))
		this.setAvailableAndCheckJobs(client)
	}

	/**
	 * Mark the daemon as available.
	 * Then calls function to check if there are any doable jobs.
	 *
	 * @param daemon - The daemon that is available.
	 */
	private setAvailableAndCheckJobs(daemon: ClientHttp2Session): void {
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
			const daemon: ClientHttp2Session = this.availableDaemons.values().next()
				.value as ClientHttp2Session

			assert(daemon, 'No available daemon found (logic error).')

			this.assignJobToDaemon(job, daemon)
		} else if (this.jobOrderer.isDone()) {
			this.closeAllDaemonsAndFinish()
		}
	}

	/**
	 * Closes all daemons.
	 * Emits 'done' once all daemons are closed.
	 */
	private closeAllDaemonsAndFinish() {
		for (const daemon of this.availableDaemons) {
			daemon.close(() => {
				this.availableDaemons.delete(daemon)
				if (this.availableDaemons.size === 0) {
					this.emit('done')
				}
			})
		}
	}

	/**
	 * Asks the daemon to work on the job.
	 * Sends HTTP request and handles response.
	 *
	 * @param job - The job to assign.
	 * @param daemon - The daemon to which to assign the job.
	 */
	private assignJobToDaemon(job: Job, daemon: ClientHttp2Session) {
		this.availableDaemons.delete(daemon)
		const request = daemon.request({ ':path': `/${job.getName()}` })
		daemon.on('error', () => this.jobOrderer.reportFailedJob(job))

		let data = ''
		request.setEncoding('utf8')
		request.on('data', (chunk) => (data += chunk))

		request.on('end', () => {
			if (data === 'failed') {
				this.jobOrderer.reportFailedJob(job)
			} else {
				this.jobOrderer.reportCompletedJob(job)
			}

			this.emit('progress', job, data)
			this.setAvailableAndCheckJobs(daemon)
		})
	}
}
