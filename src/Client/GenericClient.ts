import { EventEmitter } from 'events'

import { Client, JobResult } from './Client'
import {
	JobOrderer,
	IterableJobOrderer,
	StopJobOrdererIteration,
} from '../JobOrderer'
import { Job } from '../Job/Job'
import { ConnectionFactory, Connection } from './Connection'

/**
 * A Junknet client implementation using a provided connection factory.
 * It distributes the given jobs among daemons it knows about.
 */
export class GenericClient extends EventEmitter implements Client {
	readonly #connect: ConnectionFactory

	readonly #jobs: IterableJobOrderer

	/**
	 * Create a client whose responsibility is to finish jobs.
	 * It won't start until it knows about some daemons.
	 *
	 * @param connect - A connection factory compatible with the daemons you will use.
	 * @param orderer - A job orderer that tracks the jobs to be completed.
	 */
	constructor(connect: ConnectionFactory, orderer: JobOrderer) {
		super()
		this.#connect = connect
		this.#jobs = new IterableJobOrderer(orderer)
	}

	/**
	 * Add a new daemon to the swarm.
	 * The client may now give jobs to this daemon.
	 *
	 * @param host - hostname or IP address of daemon
	 * @param port - port number of daemon on the host
	 * @override
	 */
	public introduce(host: string, port: number): void {
		// Absorb the Promise at this API boundary so the user can just fire-and-forget.
		this.#connect(host, port)
			.then((daemon) => this.daemonThread(daemon))
			.catch((err) => this.emit('error', err))
	}

	/**
	 * Notify all threads to exit and clean up resources.
	 * The overall operation is considered to have failed.
	 */
	public quit(): void {
		this.finish(false)
		this.#jobs.cancel()
	}

	/**
	 * Notify the caller of completion.
	 * It's safe to call this multiple times.
	 *
	 * @param success - Whether the overall operation succeeded.
	 */
	private finish(success: boolean): void {
		// Make this function a no-op, so 'done' only fires once
		this.finish = (): void => {}
		this.emit('done', success)
	}

	/**
	 * An agent that claims jobs and runs them using the given daemon.
	 * It closes the connection and cleans up resources before resolving.
	 *
	 * @param daemon - The daemon that is available.
	 * @returns Asynchronously, when there are no more remaining jobs.
	 */
	private async daemonThread(daemon: Connection): Promise<void> {
		try {
			for await (const job of this.#jobs) {
				await this.assignJobToDaemon(job, daemon)
			}
			this.finish(true)
		} catch (err: unknown) {
			const errWrapper = err as { context?: Error }
			if (!(errWrapper.context instanceof StopJobOrdererIteration)) {
				throw err
			}
		} finally {
			await daemon.end()
		}
	}

	/**
	 * Asks the daemon to work on the job.
	 * Sends network request and handles response.
	 *
	 * @param job - The job to assign.
	 * @param daemon - The daemon to which to assign the job.
	 */
	private async assignJobToDaemon(job: Job, daemon: Connection): Promise<void> {
		let result: JobResult | undefined
		try {
			result = await daemon.run(job)
		} catch (err: unknown) {
			this.#jobs.reportFailed(job)
			return
		}

		this.#jobs.reportCompleted(job)
		this.emit('progress', job, result)

		// Nonzero status means the whole operation fails, gracefully.
		if (result.status) {
			this.quit()
		}
	}
}
