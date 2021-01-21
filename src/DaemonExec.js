const util = require('util')
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

const importImage = async (name) => {
	try{
		const out = await docker.pull(name)
		return out
	} catch(err) {
		console.log(err)
	}
}

const createContainer = async (name, image, command) => {
	try{
		const container = await docker.createContainer({Name: name, Image: image, Cmd: command})
		return container
	} catch(err) {
		console.log(err)
	}
}

const stopContainer = async (container) => {
	try{
		await container.stop()
	} catch(err) {
		console.log(err)
	}
}

const removeContainer = async (container) => {
	try{
		await container.remove()
	} catch(err) {
		console.log(err)
	}
}

/*listImages().then((images) => {
	images.forEach(function (imageInfo) {
		console.log(imageInfo)
	})
})*/

/*listContainers().then((containers) => {
	containers.forEach(function (containerInfo) {
		console.log(containerInfo)
	})
})*/

/*importImage('ubuntu').then(() => {
	listImages().then((images) => {
		images.forEach(function (imageInfo) {
			console.log(imageInfo)
		})
	})
})*/

/*createContainer('testest', 'ubuntu', ['/bin/yes']).then((container) => {
	container.start(async (err,data) => {
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

listImages().then((images) => {
	importImage('ubuntu:latest').then(() => {
		createContainer('testtest', 'ubuntu', ['/bin/yes']).then( async (container) => {
			container.start(async (err,data) => {
				if(err)
					console.log(err)
				else {
					/*container.stop()
					container.remove()*/
					console.log('started')

					await container.stop()
					console.log('stopped')

					await container.remove()
					console.log('removed')
				}
			})
		})
	})
})

module.export = {listContainers, listImages}
