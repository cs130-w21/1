import { ClientHttp2Session, connect } from 'http2'
import { EventEmitter } from 'events'

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
 * Representation of a single job to be executed.
 * Obviously, in the future this will not just be a string.
 * @experimental
 */
export type Job = string

/**
 * A Junknet client. It distributes the given jobs among daemons it knows about.
 *
 * @remarks
 * Events:
 * - `'error'(Error)`: network-related failure
 * - `'progress'({@link Job}, string)`: a finished job resulted in the given data
 * - `'done'()`: all jobs completed
 *
 * @experimental
 */
export class Client extends EventEmitter {
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
	 */
	introduce(host: string, port: number): void {
		const client = connect(`http://${hostAndPort(host, port)}`)
		client.on('error', (err) => this.emit('error', err))
		this.available(client)
	}

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
		req.on('data', (chunk) => (data += chunk))

		req.on('end', () => {
			this.emit('progress', job, data)
			this.available(client)
		})
	}
}
