import { Client } from 'ssh2'

import { once } from 'events'
import { promisify } from 'util'

import { ConnectionFactory, ProcessStreams } from './Connection'
import { Job } from '../Job/Job'
import { JobResult } from './Client'
import { JobRequest } from '../Network'

// TODO: not hard-coded
const IMAGE_NAME = 'buildpack-deps:bullseye'
const SSH_USER = 'junknet'

function jobToRequest(job: Job): JobRequest {
	return { image: IMAGE_NAME, target: job.getName() }
}

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
			const [code] = (await once(stream, 'close')) as number[]
			return { status: code }
		},

		async end(): Promise<void> {
			conn.end()
		},
	}
}
