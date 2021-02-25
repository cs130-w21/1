import { EventEmitter } from 'events'
import { strict as assert } from 'assert'
import { Client } from './Client'
import { JobOrderer } from '../JobOrderer/JobOrderer'
import { Job } from '../Job/Job'
import { createHttp2Connection } from './Http2Connection'
import { Connection } from './Connection'

/**
 * A mock Junknet client using HTTP/2.
 * It distributes the given jobs among daemons it knows about.
 */
export class Http2Client extends EventEmitter implements Client {
	private readonly availableDaemons: Set<Connection> = new Set()

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
		createHttp2Connection(host, port)
			.then((client) => this.setAvailableAndCheckJobs(client))
			.catch((err) => this.emit('error', err))
	}

	/**
	 * Mark the daemon as available.
	 * Then calls function to check if there are any doable jobs.
	 *
	 * @param daemon - The daemon that is available.
	 */
	private setAvailableAndCheckJobs(daemon: Connection): void {
		this.availableDaemons.add(daemon)
		this.checkJobsAndAssign()
	}

	/**
	 * Tries to assign the next available job to a daemon.
	 * Closes all daemons if all jobs are finished.
	 */
	private checkJobsAndAssign(): void {
		if (this.jobOrderer.isDone()) {
			this.closeAllDaemonsAndFinish()
			return
		}

		while (this.availableDaemons.size > 0) {
			const job = this.jobOrderer.popNextJob()
			if (!job) {
				break
			}

			const daemon = this.availableDaemons.values().next().value as Connection
			assert(daemon, 'No available daemon found (logic error).')

			this.assignJobToDaemon(job, daemon)
		}
	}

	/**
	 * Closes all daemons.
	 * Emits 'done' once all daemons are closed.
	 */
	private closeAllDaemonsAndFinish() {
		for (const daemon of this.availableDaemons) {
			daemon
				.end()
				.then(() => {
					this.availableDaemons.delete(daemon)
					if (this.availableDaemons.size === 0) {
						this.emit('done')
					}
				})
				.catch((err) => this.emit('error', err))
		}
	}

	/**
	 * Asks the daemon to work on the job.
	 * Sends HTTP request and handles response.
	 *
	 * @param job - The job to assign.
	 * @param daemon - The daemon to which to assign the job.
	 */
	private assignJobToDaemon(job: Job, daemon: Connection) {
		this.availableDaemons.delete(daemon)
		daemon
			.run(job)
			.then((data) => {
				this.jobOrderer.reportCompletedJob(job)
				this.emit('progress', job, data)
			})
			.catch(() => this.jobOrderer.reportFailedJob(job))
			.finally(() => this.setAvailableAndCheckJobs(daemon))
	}
}
