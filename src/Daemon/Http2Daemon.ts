import { createServer } from 'http2'
import { Server } from 'net'

const MAX_DELAY_MS = 2000
const FAILURE_PROBABILITY = 0.1

/**
 * Randomly generate a number between 0 and {@link MAX_DELAY_MS}.
 * @returns the generated number
 */
function mockDelayMs(): number {
	return MAX_DELAY_MS * Math.random()
}

/**
 * Has a {@link FAILURE_PROBABILITY} chance of returning true.
 *
 * @returns true {@link FAILURE_PROBABILITY} of the time
 */
function mockFailure(): boolean {
	return Math.random() < FAILURE_PROBABILITY
}

/**
 * Dummy Junknet server, using HTTP/2 as a placeholder.
 * Echoes the requested path back to the client in uppercase as plain text.
 * Randomly delayed response to create more interesting tests.
 * @deprecated Use the SSH daemon instead.
 */
export function createHttp2Daemon(): Server {
	const server = createServer()
	server.on('stream', (stream, headers) => {
		const input = headers[':path']

		if (!input) {
			stream.respond({ status: 400, 'content-type': 'text/plain' })
			stream.end('Missing :path header.')
			return
		}

		const output = input.toUpperCase()
		setTimeout(() => {
			if (mockFailure()) {
				stream.respond({ status: 500, 'content-type': 'text/plain' })
				stream.end('failed')
			} else {
				stream.respond({
					':status': 200,
					'content-type': 'text/plain',
				})
				stream.end(output)
			}
		}, mockDelayMs())
	})

	return server
}
