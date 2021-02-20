import * as net from 'net'
import { Server, Session } from 'ssh2'
import Dockerode from 'dockerode'
import { readFileSync } from 'fs'

import { parseJobRequest } from './JobRequest'
import { runJob } from './RunJob'

const HOST_KEY_PATH = 'host.key'
const EXEC_FAIL_SIG = 'USR1'

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

		const channel = accept()
		runJob(docker, request, channel).catch((e) => {
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			channel.exit(EXEC_FAIL_SIG, false, `${e}`)
			channel.end()
		})
	})
}

export function createDaemon(docker: Dockerode): net.Server {
	const server = new Server({ hostKeys: [readFileSync(HOST_KEY_PATH)] })
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
