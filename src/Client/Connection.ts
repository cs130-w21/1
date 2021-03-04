import { Job } from '../Job/Job'
import { JobResult } from './Client'

export interface ProcessStreams {
	stdin: NodeJS.ReadableStream
	stdout: NodeJS.WritableStream
	stderr: NodeJS.WritableStream
}

/**
 * Create a new connection to a daemon.
 * @param host - Hostname or IP address of the daemon.
 * @param port - The daemon's port number on the host.
 * @returns Resolve with a connection to the daemon, or reject with the underlying protocol error.
 */
export type ConnectionFactory = (
	host: string,
	port: number,
) => Promise<Connection>

/**
 * Wrapper for a connection to a Daemon.
 */
export interface Connection {
	/**
	 * Run the requested job on the connected daemon.
	 * @param streams - Streams that the remote stdin/stdout/stderr will be piped to.
	 * @param request - A description of the job to be run.
	 * @returns Resolve with the result of the completed job, or reject with some {@link Error}.
	 */
	run(streams: ProcessStreams, request: Job): Promise<JobResult>

	/**
	 * End the connection and clean up resources.
	 * @returns Asynchronously, when the cleanup is complete.
	 */
	end(): Promise<void>
}
