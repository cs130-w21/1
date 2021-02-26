// eslint-disable-next-line import/no-extraneous-dependencies
import TypedEmitter from 'typed-emitter'

import { Job } from '../Job/Job'

/**
 * Representation of the output of a single job.
 * @experimental
 */
export interface JobResult {
	status: number
	stdout: NodeJS.ReadableStream
	stderr: NodeJS.ReadableStream
}

/**
 * Model for events emitted by {@link Client}.
 * @experimental
 */
export interface ClientEvents {
	/**
	 * An unrecoverable network error occurred.
	 *
	 * @param err - the underlying network error
	 */
	error(err: Error): void

	/**
	 * One job completed, and returned some data.
	 *
	 * @param job - the job which completed
	 * @param data - the result of that job
	 */
	progress(job: Job, data: JobResult): void

	/**
	 * All jobs have completed.
	 * The {@link progress} event will not trigger again.
	 */
	done(): void
}

/**
 * A Junknet client.
 * It's responsible for finishing some jobs by distributing them among daemons it knows about.
 * @experimental
 */
export interface Client extends TypedEmitter<ClientEvents> {
	/**
	 * Add a new daemon to the swarm.
	 * The client may now give jobs to this daemon.
	 *
	 * @param host - hostname or IP address of daemon
	 * @param port - port number of daemon on the host
	 */
	introduce(host: string, port: number): void
}
