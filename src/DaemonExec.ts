import fs = require('fs')
import Docker = require('dockerode')
//needs docker to already be running
const docker = new Docker()

const listImages = async () => {
	try {
		const images = await docker.listImages({})
		return images
	} catch (err) {
		console.log(err)
		return []
	}
}

const listContainers = async () => {
	try {
		const containers = await docker.listContainers()
		return containers
	} catch (err) {
		console.log(err)
		return []
	}
}

const importImage = async (name: string) => {
	try {
		const stream = await docker.pull(name)
		return stream
	} catch (err) {
		console.log(err)
	}
}

//volumePairs should be of the form [[hostSrc,containerDest]]
const createContainer = async (
	image: string,
	command: string[],
	outputDir: string,
	stdoutFile: string,
	volumePairs: [[string, string]],
) => {
	try {
		const volumeJson: any = {}
		for (const volumePair of volumePairs) {
			volumeJson[`${volumePair[1]}`] = {}
		}
		const volumeArray = volumePairs.map((el) => el[0] + ':' + el[1])
		const container = await docker.createContainer({
			Image: image,
			Cmd: command,
			Volumes: volumeJson,
			HostConfig: {
				Binds: volumeArray,
			},
			AttachStdout: true,
			AttachStderr: true,
		})
		const stream = await container.attach({
			stream: true,
			stdout: true,
			stderr: true,
		})
		await fs.mkdir(outputDir, { recursive: true }, (err) => {
			if (err) {
				console.log(err)
				throw err
			}
		})
		const writeStream = fs.createWriteStream(`${outputDir}/${stdoutFile}.out`)
		stream.pipe(writeStream)
		return container
	} catch (err) {
		console.log(err)
		return null
	}
}

const stopContainer = async (container: any) => {
	try {
		await container.stop()
	} catch (err) {
		console.log(err)
	}
}

const removeContainer = async (container: any) => {
	try {
		await container.remove()
	} catch (err) {
		console.log(err)
	}
}

const runContainer = async (container: any) => {
	container.start(async (err: any) => {
		if (err) {
			console.log(err)
		} else {
			console.log('started')
			container.wait(async (err: any, data: any) => {
				if (err) {
					console.log(err)
				}
				console.log('container end: ', data)
				await container.remove()
				console.log('removed')
			})
		}
	})
}

//This method is only an example of how to run a command. This is not part of the API
const runCommand = async (
	image: string,
	command: string[],
	outputDir: string,
	stdoutFile: string,
	volumePairs: [[string, string]],
) => {
	//create helper function to run command to avoid duplication
	const onFinished = (err: any) => {
		if (err) console.log(err)
		createContainer(image, command, outputDir, stdoutFile, volumePairs).then(
			async (container: any) => {
				//start container
				runContainer(container)
			},
		)
	}

	//callback for determining progress of image fetch
	const onProgress = (event: any) => {
		console.log(event.status)
		if (
			event.progressDetail &&
			event.progressDetail.current &&
			event.progressDetail.total
		) {
			console.log(
				`${event.progressDetail.current}/${event.progressDetail.total} `,
			)
		}
		if (event.progress) {
			console.log(event.progress)
		}
	}

	//get the image list
	const images = await listImages()

	if (
		images.findIndex(
			(e: any) => e.RepoTags.findIndex((el: string) => el == image) > -1,
		) < 0
	) {
		//if image is not fetched, fetch it (search only works if version is in image)
		console.log(`Fetching image: ${image}`)
		const stream = await importImage(image)
		docker.modem.followProgress(stream, onFinished, onProgress)
	} else {
		//if image is fetched, just run command
		onFinished(null)
	}
}

runCommand('ubuntu:latest', ['/bin/ls', '/stuff'], './output', 'output', [
	['/bin', '/stuff'],
])

module.exports = {
	listContainers,
	listImages,
	importImage,
	createContainer,
	stopContainer,
	removeContainer,
	runContainer,
}
