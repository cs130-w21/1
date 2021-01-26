import fs = require('fs')
import path = require('path')
import Docker = require('dockerode')

//needs docker to already be running
const docker = new Docker()

import {
	listImages,
	importImage,
	createContainer,
	attachStreams,
	removeContainer,
} from './DaemonExec'

//This method is only an example of how to run a command. This is not part of the API
const runCommand = async (
	image: string,
	command: string[],
	inputDir: string,
	stdinFile: string,
	outputDir: string,
	stdoutFile: string,
	errorDir: string,
	stderrFile: string,
	volumePairs: [string, string][],
) => {
	//create helper function to run command to avoid duplication
	const onFinished = async (err: any) => {
		if (err) console.log(err)
		let stdinStream: any = process.stdin
		if (inputDir != '' && stdinFile != '') {
			stdinStream = fs.createReadStream(
				`${inputDir}/${stdinFile}`,
				'binary',
			)
		}
		let stdoutStream: any = process.stdout
		if (outputDir != '' && stdoutFile != '') {
			await fs.mkdir(outputDir, { recursive: true }, (err) => {
				if (err) {
					console.log(err)
					throw err
				}
			})
			stdoutStream = fs.createWriteStream(`${outputDir}/${stdoutFile}`)
		}
		let stderrStream: any = process.stderr
		if (errorDir != '' && stderrFile != '') {
			await fs.mkdir(errorDir, { recursive: true }, (err) => {
				if (err) {
					console.log(err)
					throw err
				}
			})
			stderrStream = fs.createWriteStream(`${errorDir}/${stderrFile}`)
		}
		await createContainer(
			image,
			command,
			volumePairs,
		).then(async (container: any) => {
			await attachStreams(
				container,
				stdinStream,
				stdoutStream,
				stderrStream,
			)
			//start container
			await container.start(async (err: any) => {
		                if (err) {
		                        console.log(err)
		                } else {
		                        console.log('started')
		                        container.wait(async (err: any, data: any) => {
		                                if (err) {
		                                        console.log(err)
		                                }
	        	                        console.log('container end: ', data)
		                                removeContainer(container)
		                        })
				}
        	        })
		})
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

runCommand(
	'ubuntu:latest',
	['/bin/cat'],
	'./input',
	'input',
	'./output',
	'output',
	'./error',
	'error',
	[[path.resolve('./output'), '/stuff']],
)

runCommand(
	'ubuntu:latest',
	['/bin/ls'],
	'',
	'',
	'',
	'',
	'',
	'',
	[],
)
