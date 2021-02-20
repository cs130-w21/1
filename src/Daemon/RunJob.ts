import Dockerode from 'dockerode'
import { ServerChannel } from 'ssh2'

import { attachStreams, createContainer } from './DaemonExec'
import { JobRequest } from './JobRequest'

function argvForMake(target: string): string[] {
	return ['make', target]
}

export async function runJob(
	docker: Dockerode,
	request: JobRequest,
	channel: ServerChannel,
): Promise<void> {
	await docker.pull(request.image)
	const container = await createContainer(
		docker,
		request.image,
		argvForMake(request.target),
		[], // TODO: obviously Make doesn't work without its Makefile
	)
	await attachStreams(container, channel, channel, channel.stderr)
	await container.start()
	await container.wait()
	// TODO: inspect container for exit code, then send it over the channel
}
