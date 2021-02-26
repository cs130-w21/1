import { EventEmitter } from 'events'

import { Client } from './Client'
import { JobOrderer } from '../JobOrderer/JobOrderer'
import { Job } from '../Job/Job'
import { ConnectionFactory, Connection } from './Connection'

/**
 * A Junknet client implementation using a provided connection factory.
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
	constructor(
		private readonly connect: ConnectionFactory,
		private readonly jobOrderer: JobOrderer,
	) {
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
		this.connect(host, port)
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
			this.closeAllDaemonsAndFinish().catch((err) => this.emit('error', err))
			return
		}

		for (const daemon of this.availableDaemons) {
			const job = this.jobOrderer.popNextJob()
			if (!job) {
				break
			}

			this.assignJobToDaemon(job, daemon)
		}
	}

	/**
	 * Closes all daemons.
	 * Emits 'done' once all daemons are closed.
	 */
	private async closeAllDaemonsAndFinish(): Promise<void> {
		await Promise.all([...this.availableDaemons].map((daemon) => daemon.end()))
		this.emit('done')
	}

	/**
	 * Asks the daemon to work on the job.
	 * Sends network request and handles response.
	 *
	 * @param job - The job to assign.
	 * @param daemon - The daemon to which to assign the job.
	 */
	private assignJobToDaemon(job: Job, daemon: Connection): void {
		this.availableDaemons.delete(daemon)
		daemon
			.run(job)
			.then((data) => {
				this.jobOrderer.reportCompletedJob(job)
				this.emit('progress', job, data)
				return null // For linter rule promise/always-return.
			})
			.catch(() => this.jobOrderer.reportFailedJob(job))
			.then(() => this.setAvailableAndCheckJobs(daemon))
			.catch((err) => this.emit('error', err))
	}
}
