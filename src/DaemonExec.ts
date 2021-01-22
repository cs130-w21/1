const util = require('util')
const fs = require('fs')
const Docker = require('dockerode')
//needs docker to already be running
const docker = new Docker()

const listImages = async () => {
	try{
		const images = await docker.listImages({})
		return images
	} catch(err) {
		console.log(err)
	}
}

const listContainers = async () => {
	try{
		const containers = await docker.listContainers()
		return containers
	} catch(err) {
		console.log(err)
	}
}

const importImage = async (name: string) => {
	try{
		const stream = await docker.pull(name)
		return stream
	} catch(err) {
		console.log(err)
	}
}

const createContainer = async (name: string, image: string, command: string[]) => {
	try{
		const container = await docker.createContainer({Name: name, Image: image, Cmd: command, AttachStdout: true, AttachStderr: true})
		return container
	} catch(err) {
		console.log(err)
	}
}

const stopContainer = async (container: object) => {
	try{
		await container.stop()
	} catch(err) {
		console.log(err)
	}
}

const removeContainer = async (container: object) => {
	try{
		await container.remove()
	} catch(err) {
		console.log(err)
	}
}

const runCommand = async (name: string, image: string, command: string[]) => {
	//create helper function to run command to avoid duplication
	const onFinished = (err: object, output: object) => {
		createContainer(name, image, command).then( async (container: object) => {
			//setup stream
			const stream = await container.attach({stream: true, stdout: true, stderr: true})
			const writeStream = fs.createWriteStream(`./${name}.out`)
			stream.pipe(writeStream)

			//start container
			container.start(async (err: object,data: any) => {
				if(err)
					console.log(err)
				else {
					console.log('started')
					container.wait(async (err: object,data: any) => {
						if(err)
							console.log(err)
						console.log('container end: ', data)
						await container.remove()
						console.log('removed')
					})
				}
			})
		})
	}

	//callback for determining progress of image fetch
	const onProgress = (event: object) => {
		console.log(event.status)
		if(event.progressDetail && event.progressDetail.current && event.progressDetail.total){
			console.log(`${event.progressDetail.current}/${event.progressDetail.total} `)
		}
		if(event.progress){
			console.log(event.progress)
		}
	}

	//get the image list
	const images = await listImages()

	if(images.findIndex((e: object) => e.RepoTags.findIndex((el: string) => el == image) > -1) < 0){
		//if image is not fetched, fetch it (search only works if version is in image)
		console.log(`Fetching image: ${image}`)
		const stream = await importImage(image)
		docker.modem.followProgress(stream, onFinished, onProgress)
	} else {
		//if image is fetched, just run command
		onFinished(null, null)
	}
	//TODO: remove image?
}

/*listImages().then((images: object[]) => {
	images.forEach(function (imageInfo) {
		console.log(imageInfo)
	})
})*/

/*listContainers().then((containers: object[]) => {
	containers.forEach(function (containerInfo) {
		console.log(containerInfo)
	})
})*/

/*importImage('ubuntu').then(() => {
	listImages().then((images: object[]) => {
		images.forEach(function (imageInfo: object) {
			console.log(imageInfo)
		})
	})
})*/

/*createContainer('testest', 'ubuntu', ['/bin/yes']).then((container: object) => {
	container.start(async (err: object,data: any) => {
		if(err)
			console.log(err)
		else {
			console.log('started')

			await container.stop()
			console.log('stopped')

			await container.remove()
			console.log('removed')
		}
	})
})*/

/*listImages().then((images: object[]) => {
	importImage('ubuntu:latest').then((stream: object) => {
		const onFinished = function(err: object, output: any){
			createContainer('testtest', 'ubuntu', ['/bin/yes']).then( async (container: object) => {
				container.start(async (err: object,data: any) => {
					if(err)
						console.log(err)
					else {
						console.log('started')

						await container.stop()
						console.log('stopped')

						await container.remove()
						console.log('removed')
					}
				})
			})
		}

		function onProgress(event: object) {
		}

		docker.modem.followProgress(stream, onFinished, onProgress)
	})
})*/

runCommand('name', 'ubuntu:latest', ['/bin/ls'])

module.exports = {listContainers, listImages, importImage, runCommand}
