import Dockerode from 'dockerode'

import { attachStreams, createContainer, ensureImageImport } from './DaemonExec'
import { ContainerWaitOK } from './DockerAPI'
import { RunJob } from './RunJob'

/**
 * The absolute path within the container where the Make project will be mounted.
 * TODO: Will any parent directories will be created? Or must the direct parent already exist?
 */
const CONTAINER_WORKDIR = '/root/junknet'

/**
 * Get an argv array for invoking Make for the given target.
 * @param target - The Makefile target name that should run.
 * @returns An array that can be passed to `exec(3)`.
 */
function argvForMake(target: string): string[] {
	return ['make', '-C', CONTAINER_WORKDIR, target]
}

/**
 * Factory for making a job runner using Docker.
 * The daemon would use this to know how to run a job.
 * @param docker - A connected Dockerode client.
 * @returns A job runner that uses Docker.
 */
export function dockerRunJob(docker: Dockerode): RunJob {
	return async (request, workdir, channel): Promise<void> => {
		await ensureImageImport(docker, request.image)
		const container = await createContainer(
			docker,
			request.image,
			argvForMake(request.target),
			[{ fromPath: workdir, toPath: CONTAINER_WORKDIR }],
		)
		await attachStreams(container, channel, channel, channel.stderr)
		await container.start()

		const status = (await container.wait()) as ContainerWaitOK
		if (status.Error) {
			// TODO: find out what kinds of situations this can happen in.
			// TODO: if it's not exceptional, notify the client instead of dropping the session.
			throw new Error(status.Error.Message)
		}

		channel.exit(status.StatusCode)
		channel.end()

		// TODO: set HostConfig.AutoRemove upon construction, rather than manually removing
		await container.remove()
	}
}
