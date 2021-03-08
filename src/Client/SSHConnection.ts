import { Client } from 'ssh2'

import { once } from 'events'
import { promisify } from 'util'
import { create, extract } from 'tar'

import { ConnectionFactory, ProcessStreams } from './Connection'
import { Job } from '../Job/Job'
import { JobResult } from './Client'
import {
	jobToJobRequest,
	jobToPushInputs,
	jobToGetArtifacts,
} from './ClientNetConvert'

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
			// Send PushInputs:
			const putPayload = JSON.stringify(jobToPushInputs(job))
			const pushInputStream = await promisify(conn.exec.bind(conn))(putPayload)

			const fileList: string[] = job.getDeepPrerequisitesIterable()
			fileList.push('Makefile')

			const tarPutStream = create({}, fileList)
			tarPutStream.pipe(pushInputStream)
			pushInputStream.pipe(streams.stdout)
			pushInputStream.stderr.pipe(streams.stderr)

			const [putCode] = (await once(pushInputStream, 'close')) as ExitSpec
			if (putCode !== 0) {
				throw new FailedJobError()
			}

			// Send JobRequest:
			const payload = JSON.stringify(jobToJobRequest(job))
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
			if (code !== 0) {
				return { status: code }
			}

			// Send GetArtifacts:
			const artifactPayload = JSON.stringify(jobToGetArtifacts(job))
			const artifactStream = await promisify(conn.exec.bind(conn))(
				artifactPayload,
			)

			const tarGetStream = extract({ cwd: process.cwd() })
			streams.stdin.pipe(stream)
			artifactStream.pipe(tarGetStream)
			stream.stderr.pipe(streams.stderr)

			const [getCode] = (await once(artifactStream, 'close')) as ExitSpec
			if (getCode !== 0) {
				throw new FailedJobError()
			}

			return { status: code }
		},

		async end(): Promise<void> {
			conn.end()
		},
	}
}
