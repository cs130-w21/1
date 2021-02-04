#!/usr/bin/env node

import { promises as fs, createReadStream, createWriteStream } from 'fs'
import { resolve } from 'path'
import * as Docker from 'dockerode'

import {
	VolumeDefinition,
	ensureImageImport,
	createContainer,
	attachStreams,
	removeContainer,
} from './DaemonExec'

// needs docker to already be running
const docker = new Docker()

// This method is only an example of how to run a command. This is not part of the API
const runCommand = async (
	image: string,
	command: string[],
	inputDir: string,
	stdinFile: string,
	outputDir: string,
	stdoutFile: string,
	errorDir: string,
	stderrFile: string,
	volumePairs: VolumeDefinition[],
) => {
	// create helper function to run command to avoid duplication
	const onFinished = async (err?: Error) => {
		if (err) console.log(err)
		let stdinStream: NodeJS.ReadableStream = process.stdin
		if (inputDir !== '' && stdinFile !== '') {
			stdinStream = createReadStream(`${inputDir}/${stdinFile}`, 'binary')
		}
		let stdoutStream: NodeJS.WritableStream = process.stdout
		if (outputDir !== '' && stdoutFile !== '') {
			await fs.mkdir(outputDir, { recursive: true })
			stdoutStream = createWriteStream(`${outputDir}/${stdoutFile}`)
		}
		let stderrStream: NodeJS.WritableStream = process.stderr
		if (errorDir !== '' && stderrFile !== '') {
			await fs.mkdir(errorDir, { recursive: true })
			stderrStream = createWriteStream(`${errorDir}/${stderrFile}`)
		}
		const container = await createContainer(docker, image, command, volumePairs)
		await attachStreams(container, stdinStream, stdoutStream, stderrStream)
		container.start((error) => {
			if (error) {
				console.log(error)
			} else {
				console.log('started')
				container.wait((e, data) => {
					if (e) {
						console.log(e)
					}
					console.log('container end: ', data)
					removeContainer(container).catch((er) => {
						if (er) console.log(er)
					})
				})
			}
		})
	}

	// callback for determining progress of image fetch
	const onProgress = (event: {
		status: string
		progressDetail: { current: number; total: number }
		progress: string
		id: string
	}) => {
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

	await ensureImageImport(docker, image, onFinished, onProgress)
}

runCommand(
	'ubuntu:latest',
	['/bin/cat'],
	'.',
	'package.json',
	'./output',
	'output',
	'./error',
	'error',
	[{ fromPath: resolve('./output'), toPath: '/stuff' }],
).catch((err) => {
	console.log(err)
})

runCommand('ubuntu:latest', ['/bin/ls'], '', '', '', '', '', '', []).catch(
	(err) => {
		console.log(err)
	},
)
