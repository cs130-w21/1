import * as net from 'net'
import { Server, ServerConfig, Session } from 'ssh2'
import Dockerode from 'dockerode'

import { parseJobRequest } from './JobRequest'
import { runJob } from './RunJob'

const EXEC_FAIL_SIG = 'USR2'
const EXEC_FAIL_MSG = 'Failed to start job execution.'

/**
 * Service a Junknet client's requests, such as running jobs and transferring artifacts.
 * @param docker - A connected Dockerode client.
 * @param session - A new incoming SSH session.
 */
function handleSession(docker: Dockerode, session: Session): void {
	session.on('exec', (accept, reject, info) => {
		// `accept` and `reject` are only defined if the client wants a response
		// For Junknet, it doesn't make sense to run a job without a client waiting for it.
		if (!reject) {
			return
		}

		const request = parseJobRequest(info.command)
		if (!request) {
			reject()
			return
		}

		console.log(request)

		const channel = accept()
		runJob(docker, request, channel).catch((e: Error) => {
			channel.stderr.end(`${e.name}: ${e.message}\n`)
			channel.exit(EXEC_FAIL_SIG, false, EXEC_FAIL_MSG)
			channel.end()
		})
	})
}

/**
 * Create a Junknet daemon implemented over SSH.
 *
 * @remarks
 * - It's important to listen for the 'error' event, as the default behavior is to stop serving.
 * - SSH keys may be generated via `ssh-keygen` from OpenSSH.
 *
 * @param docker - A connected Dockerode client.
 * @param hostKeys - Private SSH keys to authenticate this daemon to clients.
 * @returns The daemon as a Server.
y */
export function createDaemon(
	docker: Dockerode,
	hostKeys: ServerConfig['hostKeys'],
): net.Server {
	const server = new Server({ hostKeys })
	server.on('connection', (client) => {
		client.on('authentication', (ctx) => ctx.accept())
		client.on('ready', () => {
			client.on('session', (accept) => handleSession(docker, accept()))
		})
	})

	// ssh2 v0.8.9 doesn't know about net.Server.listening
	server.on('listening', function workaround(this: net.Server) {
		this.listening = true
	})

	return server as net.Server
}
