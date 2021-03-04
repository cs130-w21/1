import { Server, ServerConfig, ClientInfo, AuthContext, Session } from 'ssh2'
import { create } from 'tar'

import * as net from 'net'
import { once } from 'events'

import { createTempDir, destroyTempDir, safeResolve } from './TempVolume'
import { Request, parse } from '../Network'
import { RunJob } from './RunJob'

const EXEC_FAIL_SIG = 'USR2'
const EXEC_FAIL_MSG = 'Failed to start job execution.'

/**
 * Decide whether or not to authenticate the given client.
 * Currently, this is a no-op (all clients are allowed).
 * @param ctx - The authentication context from the SSH server.
 * @param info - Information about the remote client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handleAuthentication(ctx: AuthContext, info: ClientInfo): void {
	ctx.accept()
}

/**
 * Service a Junknet client's requests, such as running jobs and transferring artifacts.
 * @param runJob - A strategy for executing jobs.
 * @param session - A new incoming SSH session.
 */
function handleSession(runJob: RunJob, session: Session): void {
	const tempDirPromise = createTempDir()
	tempDirPromise.catch(() => {
		// Proactively catch the rejection to avoid a race condition.
	})

	session.on('close', () => {
		// Close the tempdir if it was created. Any errors are irrelevant here.
		tempDirPromise.then((root) => destroyTempDir(root)).catch(() => {})
	})

	session.on('exec', (accept, reject, info) => {
		// `accept` and `reject` are only defined if the client wants a response.
		// For Junknet, it doesn't make sense to run a job without a client waiting for it.
		if (!reject) {
			return
		}

		const request = parse(Request, info.command)
		if (!request) {
			reject()
			return
		}

		const channel = accept()
		tempDirPromise
			.then(
				// ESLint has no idea what we're trying to do here.
				// The explicit return value and no default ensure that the switch is exhaustive.
				// eslint-disable-next-line consistent-return
				(root): Promise<unknown> => {
					// eslint-disable-next-line default-case, promise/always-return
					switch (request.action) {
						case 'job':
							return runJob(request, channel)
						case 'get':
							// CRITICAL: Make sure user-supplied paths don't escape the directory!
							if (request.files.some((file) => !safeResolve(root, file))) {
								throw new Error('Permission denied.')
							}
							// TODO: properly handle errors here so it can't crash the server.
							create({ cwd: root }, request.files).pipe(channel)
							return once(channel, 'end')
					}
				},
			)
			.catch((err: Error) => {
				channel.stderr.end(`${err.name}: ${err.message}\n`)
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
 * @param runJob - A job-running strategy, invoked when a client requests a job.
 * @param hostKeys - Private SSH keys to authenticate this daemon to clients.
 * @returns The daemon as a Server.
 */
export function createSSHDaemon(
	runJob: RunJob,
	hostKeys: ServerConfig['hostKeys'],
): net.Server {
	const server = new Server({ hostKeys })
	server.on('connection', (client, info) => {
		client.on('authentication', (ctx) => handleAuthentication(ctx, info))
		client.on('ready', () => {
			client.on('session', (accept) => handleSession(runJob, accept()))
		})
		client.on('error', () => {
			// TODO: If this does need to be logged, refactor the error handling.
		})
	})

	// ssh2 v0.8.9 doesn't know about net.Server.listening
	server.on('listening', function workaround(this: net.Server) {
		this.listening = true
	})

	return server as net.Server
}
