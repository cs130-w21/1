/**
 * Returns information about the images
 * @param docker - The docker daemon to pull information from
 * @returns an array of ImageInfo
 */
export async function listImages(docker: any) {
	const images = await docker.listImages({})
	return images
}

/**
 * Returns information about the containers
 * @param docker - The docker daemon to pull information from
 * @returns an array of ContainerInfo
 */
export async function listContainers(docker: any) {
	const containers = await docker.listContainers()
	return containers
}

/**
 * Starts the import of an image
 * @param docker - The docker daemon with which the image will be stored
 * @param name - The name of the image to pull
 * @returns a ReadableStream to track the progress of the import
 */
export async function importImage(docker: any, name: string) {
	const stream = await docker.pull(name)
	return stream
}

/**
 * Creates a Docker container
 * @param docker - the docker daemon that controls the container
 * @param image - the image the container uses
 * @param command - an array that holds the command for the container
 * @param volumePairs - an array of string pairs that represents the volumes
 * @returns the Container
 */
export async function createContainer(
	docker: any,
	image: string,
	command: string[],
	volumePairs: [string, string][] = [],
) {
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

/**
 * Attaches input, output, and error streams to a container
 * Default is stdin, stdout, and stderr
 * @param container - the container to attach
 * @param stdinStream - the input stream
 * @param stdoutStream - the output stream
 * @param stderrStream - the error strean
 * @returns a ReadWriteStream for the container
 */
export async function attachStreams(
	container: any,
	stdinStream = process.stdin,
	stdoutStream = process.stdout,
	stderrStream = process.stderr,
) {
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

/**
 * Stops the container
 * @params container - the container to stop
 */
export async function stopContainer(container: any) {
	await container.stop()
}

/**
 * Removes the container
 * @params container - the container to remove
 */
export async function removeContainer(container: any) {
	await container.remove()
}