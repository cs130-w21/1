import { connect } from 'http2'
import { once } from 'events'
import { Readable } from 'stream'

import { ConnectionFactory } from './Connection'
import { Job } from '../Job/Job'
import { JobResult } from './Client'

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
 * Create a new connection to a daemon using HTTP/2.
 *
 * @param host - Hostname or IP address of the daemon.
 * @param port - The daemon's port number on the host.
 * @returns A connection to the daemon, or the underlying HTTP/2 error.
 *
 * @deprecated Use an SSH connection (with an SSH daemon) instead.
 */
export const createHttp2Connection: ConnectionFactory = async (host, port) => {
	const client = connect(`http://${hostAndPort(host, port)}`)
	await once(client, 'connect')
	return {
		async run(job: Job): Promise<JobResult> {
			const request = client.request({ ':path': `/${job.getName()}` })

			let data = ''
			request.setEncoding('utf8')
			request.on('data', (chunk) => (data += chunk))
			await once(request, 'end')

			return {
				status: +(data === 'failed'),
				stdout: new Readable({
					read(): void {
						this.push(data)
					},
				}),
				stderr: new Readable(),
			}
		},

		async end(): Promise<void> {
			client.close()
			await once(client, 'close')
		},
	}
}
