import * as net from 'net'
import { Connection, Server, Session } from 'ssh2'
import { readFileSync } from 'fs'

const RUN_JOB_CMD = 'run-job'
const HOST_KEY_PATH = 'host.key'

function handleSession(session: Session): void {
	session.on('exec', (accept, reject, info) => {
		if (info.command !== RUN_JOB_CMD) {
			reject?.()
			return
		}

		// @types/ssh2 is incomplete; accept is only defined if the client wants a response
		if (accept) {
			const channel = accept()
			channel.write('Hello world!\n')
			channel.exit(42)
			channel.end()
		}
	})
}

function handleClient(client: Connection): void {
	client.on('authentication', (ctx) => ctx.accept())
	client.on('ready', () => {
		client.on('session', (accept) => handleSession(accept()))
	})
}

export function createDaemon(): net.Server {
	const server = new Server({ hostKeys: [readFileSync(HOST_KEY_PATH)] })
	server.on('connection', handleClient)

	// ssh2 v0.8.9 doesn't know about net.Server.listening
	server.on('listening', function workaround(this: net.Server) {
		this.listening = true
	})

	return server as net.Server
}
