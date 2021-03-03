import { Client } from 'ssh2'

import { once } from 'events'
import { promisify } from 'util'

import { ConnectionFactory, ProcessStreams } from './Connection'
import { Job } from '../Job/Job'
import { JobResult } from './Client'
import { JobRequest } from '../Network'

/**
 * SSH username used to connect. Its value is irrelevant.
 */
const SSH_USER = 'junknet'

/**
 * Exit status returned by an exec stream from ssh2.
 */
type ExitSpec = [null, string, boolean, string] | [number]

/**
 * Thrown when a remote daemon was unable to complete a job.
 */
class FailedJobError extends Error {}

/**
 * Convert a {@link Job} (controller world) to a {@link JobRequest} (network world).
 * That these types don't share an interface is a historical accident.
 * @param job - The input job.
 * @returns The converted job request.
 */
function jobToRequest(job: Job): JobRequest {
	return { image: job.getEnvironment().dockerImage, target: job.getName() }
}

/**
 * Create a new connection to a daemon using SSH.
 * Uses SSH exec and sftp streams to trigger jobs.
 *
 * @remarks
 * Currently, host identification is a no-op, so no security is guaranteed.
 *
 * @param host - Hostname or IP address of the daemon.
 * @param port - Port number of the daemon on the host.
 * @returns Connection to an SSH daemon.
 */
export const createSSHConnection: ConnectionFactory = async (host, port) => {
	const conn = new Client()
	conn.connect({ host, port, username: SSH_USER })
	await once(conn, 'ready')
	return {
		async run(streams: ProcessStreams, job: Job): Promise<JobResult> {
			const payload = JSON.stringify(jobToRequest(job))
			const stream = await promisify(conn.exec.bind(conn))(payload)
			streams.stdin.pipe(stream)
			stream.pipe(streams.stdout)
			stream.stderr.pipe(streams.stderr)

			// Type inference fails if I check `code` by name instead of index.
			const exitSpec = (await once(stream, 'close')) as ExitSpec
			if (exitSpec[0] === null) {
				const [, signal, , desc] = exitSpec
				throw new FailedJobError(`${signal}: ${desc}`)
			}

			const [code] = exitSpec
			return { status: code }
		},

		async end(): Promise<void> {
			conn.end()
		},
	}
}
