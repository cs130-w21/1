import * as Docker from 'dockerode'

interface ContainerModem {
	demuxStream(
		stream: NodeJS.ReadWriteStream,
		stdoutStream: NodeJS.WritableStream,
		stderrStream: NodeJS.WritableStream,
	): void
}

interface DockerModem {
	followProgress(
		stream: NodeJS.ReadableStream,
		onFinished: (err?: Error) => Promise<void>,
		onProgress: (event: {
			status: string
			progressDetail: { current: number; total: number }
			progress: string
			id: string
		}) => void,
	): void
}

export interface VolumeDefinition {
	fromPath: string
	toPath: string
}

/**
 * Returns information about the images
 * @param docker - The docker daemon to pull information from
 * @returns an array of ImageInfo
 */
export async function listImages(docker: Docker): Promise<Docker.ImageInfo[]> {
	return docker.listImages({})
}

/**
 * Returns information about the containers
 * @param docker - The docker daemon to pull information from
 * @returns an array of ContainerInfo
 */
export async function listContainers(
	docker: Docker,
): Promise<Docker.ContainerInfo[]> {
	return docker.listContainers()
}

/**
 * Starts the import of an image
 * @param docker - The docker daemon with which the image will be stored
 * @param name - The name of the image to pull
 * @returns a ReadableStream to track the progress of the import
 */
export async function importImage(
	docker: Docker,
	name: string,
): Promise<NodeJS.ReadWriteStream> {
	const stream: NodeJS.ReadWriteStream = await (docker.pull(
		name,
	) as Promise<NodeJS.ReadWriteStream>)
	return stream
}

/**
 * Imports an image if it does not exist and then calls callbacks for progress and finish events
 * @param docker - The docker daemon with which the image will be stored
 * @param name - The name of the image to pull
 * @param onFinished - a callback for when the image import is finished
 * @param onProgress - a callback for when the progress of the image import updates
 */
export async function callbackImportImage(
	docker: Docker,
	name: string,
	onFinished: (err?: Error) => Promise<void>,
	onProgress: (event: {
		status: string
		progressDetail: { current: number; total: number }
		progress: string
		id: string
	}) => void,
): Promise<void> {
	const images = await listImages(docker)

	if (
		images.findIndex(
			(e: Docker.ImageInfo) =>
				e.RepoTags.findIndex((el: string) => el === name) > -1,
		) < 0
	) {
		// if image is not fetched, fetch it (search only works if version is in image)
		const stream = await importImage(docker, name)
		const modem: DockerModem = docker.modem as DockerModem
		modem.followProgress(stream, onFinished, onProgress)
	} else {
		// if image is fetched, just run command
		onFinished(undefined).catch((err) => {
			if (err) console.log(err)
		})
	}
}

/**
 * Creates a Docker container
 * @param docker - the docker daemon that controls the container
 * @param image - the image the container uses
 * @param command - an array that holds the command for the container
 * @param volumePairs - an array of VolumeDefinitions
 * @returns the Container
 */
export async function createContainer(
	docker: Docker,
	image: string,
	command: string[],
	volumePairs: VolumeDefinition[] = [],
): Promise<Docker.Container> {
	// make volumes in form accepted by createContainer
	const volumeJson: { [volume: string]: Record<string, never> } = {}
	Object.values(volumePairs).forEach((value) => {
		volumeJson[value.toPath] = {}
	})
	const volumeArray = volumePairs.map((el) => `${el.fromPath}:${el.toPath}`)

	// create container
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
 * @param container - the container to attach
 * @param stdinStream - the input stream
 * @param stdoutStream - the output stream
 * @param stderrStream - the error strean
 * @returns a ReadWriteStream for the container
 */
export async function attachStreams(
	container: Docker.Container,
	stdinStream: NodeJS.ReadableStream,
	stdoutStream: NodeJS.WritableStream,
	stderrStream: NodeJS.WritableStream,
): Promise<NodeJS.ReadWriteStream> {
	const stream = await container.attach({
		hijack: true,
		stream: true,
		stdin: true,
		stdout: true,
		stderr: true,
	})
	const modem: ContainerModem = container.modem as ContainerModem
	modem.demuxStream(stream, stdoutStream, stderrStream)
	stdinStream.pipe(stream)
	return stream
}

/**
 * Stops the container
 * @param container - the container to stop
 */
export async function stopContainer(
	container: Docker.Container,
): Promise<void> {
	await container.stop()
}

/**
 * Removes the container
 * @param container - the container to remove
 */
export async function removeContainer(
	container: Docker.Container,
): Promise<void> {
	await container.remove()
}
