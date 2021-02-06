import { ClientHttp2Session, connect } from 'http2'
import { EventEmitter } from 'events'

import { Client, Job } from './Client'

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
 * A mock Junknet client using HTTP/2.
 * It distributes the given jobs among daemons it knows about.
 * @deprecated Implement a {@link Client} using SSH instead.
 */
export class Http2Client extends EventEmitter implements Client {
	/**
	 * Create a client whose responsibility is to finish the given jobs.
	 * It won't start until it knows about some daemons.
	 *
	 * @param queue - array of jobs in reverse order
	 */
	constructor(private readonly queue: Job[]) {
		super()
	}

	/**
	 * Add a new daemon to the swarm.
	 * The client may now give jobs to this daemon.
	 *
	 * @param host - hostname or IP address of daemon
	 * @param port - port number of daemon on the host
	 * @override
	 */
	introduce(host: string, port: number): void {
		const client = connect(`http://${hostAndPort(host, port)}`)
		client.on('error', (err) => this.emit('error', err))
		this.available(client)
	}

	/**
	 * Drive the given daemon, by providing it with one task at a time in an async loop.
	 *
	 * @param client - a HTTP/2 client connected to a daemon.
	 */
	private available(client: ClientHttp2Session): void {
		const job = this.queue.pop()
		if (!job) {
			client.close(() => this.emit('done'))
			return
		}

		const req = client.request({ ':path': `/${job}` })
		client.on('error', (err) => this.emit('error', err))

		let data = ''
		req.setEncoding('utf8')
		req.on('data', (chunk) => {
			data += chunk
		})

		req.on('end', () => {
			this.emit('progress', job, data)
			this.available(client)
		})
	}
}
