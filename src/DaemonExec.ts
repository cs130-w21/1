import Docker = require('dockerode')

//needs docker to already be running
const docker = new Docker()

export async function listImages(){
	const images = await docker.listImages({})
	return images
}

export async function listContainers(){
	const containers = await docker.listContainers()
	return containers
}

export async function importImage(name: string){
	const stream = await docker.pull(name)
	return stream
}

export async function createContainer(
	image: string,
	command: string[],
	volumePairs: [string, string][] = [],
){
	//make volumes in form accepted by createContainer
	const volumeJson: any = {}
	for (const volumePair of volumePairs) {
		volumeJson[`${volumePair[1]}`] = {}
	}
	const volumeArray = volumePairs.map((el) => el[0] + ':' + el[1])

	//create container
	const container = await docker.createContainer({
		Image: image,
		Cmd: command,
		Volumes: volumeJson,
		HostConfig: {
			Binds: volumeArray,
		},
		AttachStdin: true,
		AttachStdout: true,
		AttachStderr: true,
		Tty: false,
		OpenStdin: true,
		StdinOnce: true,
	})

	return container
}

export async function attachStreams(container: any, stdinStream = process.stdin, stdoutStream = process.stdout, stderrStream = process.stderr){
	const stream = await container.attach({
		hijack: true,
		stream: true,
		stdin: true,
		stdout: true,
		stderr: true,
	})
	container.modem.demuxStream(stream, stdoutStream, stderrStream)
	stdinStream.pipe(stream)
	return stream
}

export async function stopContainer(container: any){
	await container.stop()
}

export async function removeContainer(container: any){
	await container.remove()
}
