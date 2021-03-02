import { Client } from 'ssh2'

import { once } from 'events'
import { promisify } from 'util'

import { ConnectionFactory } from './Connection'
import { Job } from '../Job/Job'
import { JobResult } from './Client'
import { JobRequest } from '../Network'

// TODO: not hard-coded
const IMAGE_NAME = 'buildpack-deps:bullseye'
const SSH_USER = 'junknet'

export const createSSHConnection: ConnectionFactory = async (host, port) => {
	const conn = new Client()
	conn.connect({ host, port, username: SSH_USER })
	await once(conn, 'ready')
	return {
		async run(job: Job): Promise<JobResult> {
			const request: JobRequest = {
				image: IMAGE_NAME,
				target: job.getName(),
			}
			const payload = JSON.stringify(request)
			const stream = await promisify(conn.exec.bind(conn))(payload)
			const [code] = (await once(stream, 'close')) as number[]
			return {
				status: code,
				stdout: stream,
				stderr: stream.stderr,
			}
		},

		async end(): Promise<void> {
			conn.end()
		},
	}
}
