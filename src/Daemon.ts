import { createServer } from 'http2'
import { Server } from 'net'

const MAX_DELAY_MS = 2000

/**
 * Randomly generate a number between 0 and {@link MAX_DELAY_MS}.
 * @returns the generated number
 */
function mockDelayMs(): number {
	return MAX_DELAY_MS * Math.random()
}

/**
 * Dummy Junknet server, using HTTP/2 as a placeholder.
 * Echoes the requested path back to the client in uppercase as plain text.
 * Randomly delayed response to create more interesting tests.
 * @experimental
 * Plan: Convert this server to be an SSH server using the ssh2 node.js library.
 */
export function createDaemon(): Server {
	const server = createServer()
	server.on('stream', (stream, headers) => {
		const input = headers[':path']
		if (!input) {
			// Can never happen, but let's make the type checker happy.
			return
		}

		const output = input.toUpperCase()
		setTimeout(() => {
			stream.respond({
				':status': 200,
				'content-type': 'text/plain',
			})
			stream.end(output)
		}, mockDelayMs())
	})

	return server
}
