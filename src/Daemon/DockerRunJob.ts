import Dockerode from 'dockerode'
import { ServerChannel } from 'ssh2'

import { attachStreams, createContainer, ensureImageImport } from './DaemonExec'
import { RunJob } from './RunJob'
import { JobRequest } from '../Network'

function argvForMake(target: string): string[] {
	return ['make', target]
}

/**
 * Factory for making a job runner using Docker.
 * The daemon would use this to know how to run a job.
 * @param docker - A connected Dockerode client.
 * @returns A job runner that uses Docker.
 */
export function dockerRunJob(docker: Dockerode): RunJob {
	return async (request: JobRequest, channel: ServerChannel) => {
		await ensureImageImport(docker, request.image)
		const container = await createContainer(
			docker,
			request.image,
			argvForMake(request.target), // TODO: run the command, not just print it
			[], // TODO: obviously Make doesn't work without its Makefile
		)
		await attachStreams(container, channel, channel, channel.stderr)
		await container.start()
		await container.wait()
		// TODO: inspect container for exit code, then send it over the channel
	}
}
