import { Server, ServerConfig, ClientInfo, AuthContext, Session } from 'ssh2'
import { create, extract } from 'tar'

import * as net from 'net'
import * as stream from 'stream'
import { once } from 'events'
import { promisify } from 'util'

import { createTempDir, destroyTempDir, safeResolve } from './TempVolume'
import { Request, parse, unexpected } from '../Network'
import { RunJob } from './RunJob'

const EXEC_FAIL_SIG = 'USR2'
const EXEC_FAIL_MSG = 'Failed to start job execution.'

/**
 * Exit status codes of tar(1).
 * @see https://www.gnu.org/software/tar/manual/html_section/Synopsis.html#exit-status
 */
enum TarExit {
	Good,
	Differ,
	Fatal,
}

const pipeline = promisify(stream.pipeline)

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
	const futureTempDir = createTempDir()
	futureTempDir.catch(() => {
		// Proactively catch the rejection to avoid a race condition.
	})

	session.on('close', () => {
		// Close the tempdir if it was created. Any errors are irrelevant here.
		futureTempDir.then((root) => destroyTempDir(root)).catch(() => {})
	})

	session.on('exec', (accept, reject, info) => {
		// `accept` and `reject` are only defined if the client wants a response.
		// For Junknet, it doesn't make sense to run a job without a client waiting for it.
		if (!reject) {
			return
		}

		// Type-safe request parsing. Don't even open the stream if it fails.
		const request = parse(Request, info.command)
		if (!request) {
			reject()
			return
		}

		const channel = accept()
		const handleRequest = (root: string): Promise<unknown> => {
			switch (request.action) {
				case 'job': {
					const promise = runJob(request, root, channel)
					promise.catch(() => channel.exit(EXEC_FAIL_SIG, false, EXEC_FAIL_MSG))
					return promise
				}

				case 'get': {
					// CRITICAL: Make sure user-supplied paths don't escape the directory!
					if (request.files.some((file) => !safeResolve(root, file))) {
						throw new Error('Permission denied.')
					}
					const source = create({ cwd: root }, request.files)
					source.pipe(channel, { end: false })
					const promise = once(source, 'end')
					promise.catch(() => channel.exit(TarExit.Fatal))
					return promise.then(() => channel.exit(TarExit.Good))
				}

				case 'put': {
					// TODO: Check for path traversal attacks.
					const promise = pipeline(channel, extract({ cwd: root }))
					promise.catch(() => channel.exit(TarExit.Fatal))
					return promise.then(() => channel.exit(TarExit.Good))
				}

				default:
					// This (intentionally) doesn't compile unless the switch is exhaustive.
					return unexpected(request)
			}
		}

		// Once the temporary directory is ready:
		futureTempDir
			// Delegate based on the request type.
			.then(handleRequest)
			// Format all errors to the client.
			.catch((e: Error) => channel.stderr.end(`${e.name}: ${e.message}\n`))
			// No matter what happened before, close the stream.
			.then(() => channel.end())
			// This never happens.
			.catch(() => {})
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
