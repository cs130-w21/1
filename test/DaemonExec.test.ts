import * as Docker from 'dockerode'

import { promises as fs, createReadStream, createWriteStream } from 'fs'

import { resolve, join } from 'path'

import { tmpdir } from 'os'
import {
	VolumeDefinition,
	listImages,
	listContainers,
	ensureImageImport,
	createContainer,
	attachStreams,
	stopContainer,
	removeContainer,
} from '../src/Daemon/DaemonExec'

interface ExpectedStatus {
	Error: unknown
	StatusCode: number
}

const docker = new Docker()
const testImage = 'ubuntu:18.04'
const bogusImage = 'lskjflskjflsdkfjslkfjsdlfsdjflksdj'
const inputFile = 'package.json'

describe('DaemonExec', () => {
	let container: Docker.Container
	let directory: string
	let outputFile: string
	let errorFile: string

	it('pulls a new image', async () => {
		const initialInfos = await listImages(docker)
		if (
			initialInfos.some((info) =>
				info.RepoTags.some((tag) => tag === testImage),
			)
		) {
			// if image is already imported, remove it
			const image = docker.getImage(testImage)
			await image.remove()
		}

		await ensureImageImport(docker, testImage)
		const newInfos = await listImages(docker)

		expect(
			newInfos.some((info) => info.RepoTags.some((tag) => tag === testImage)),
		).toBeTruthy()
	}, 60000)

	it('pulls an existing image', async () => {
		await ensureImageImport(docker, testImage)
		const newInfos = await listImages(docker)

		expect(
			newInfos.some((info) => info.RepoTags.some((tag) => tag === testImage)),
		).toBeTruthy()
	})

	it('fails pulling a nonexistent image', async () => {
		await expect(ensureImageImport(docker, bogusImage)).rejects.toThrow()
	})

	it('creates a specified container', async () => {
		container = await createContainer(docker, testImage, ['/bin/cat'], [])
		expect(container.id).toBeDefined()
	})

	it('attaches streams to a specified container', async () => {
		directory = await fs.mkdtemp(join(tmpdir(), 'test'))

		const stdinStream: NodeJS.ReadableStream = createReadStream(inputFile)

		outputFile = resolve(directory, inputFile)
		const stdoutStream: NodeJS.WritableStream = createWriteStream(outputFile)

		errorFile = resolve(directory, 'error')
		const stderrStream: NodeJS.WritableStream = createWriteStream(errorFile)

		const stream = await attachStreams(
			container,
			stdinStream,
			stdoutStream,
			stderrStream,
		)
		expect(stream).toBeDefined()
	})

	it('runs a specified container', async () => {
		await container.start()

		const data: ExpectedStatus = await (container.wait() as Promise<ExpectedStatus>)

		expect(data.Error).toBeNull()
		expect(data.StatusCode).toBe(0)
	})

	it('writes the correct data to the streams', async () => {
		const original = await fs.readFile(inputFile)
		const copy = await fs.readFile(outputFile)
		expect(original).toEqual(copy)

		const error = await fs.readFile(errorFile)
		expect(Buffer.byteLength(error)).toEqual(0)
	})

	it('removes a specified container', async () => {
		await removeContainer(container)
		await expect(container.start()).rejects.toThrow()
	})

	it('creates containers with correct volumes', async () => {
		const volumes: VolumeDefinition[] = [
			{ fromPath: process.cwd(), toPath: '/test' },
		]

		const volumeContainer = await createContainer(
			docker,
			testImage,
			['/bin/cat', `/test/${inputFile}`],
			volumes,
		)

		const stdoutStream: NodeJS.WritableStream = createWriteStream(outputFile)
		const stderrStream: NodeJS.WritableStream = createWriteStream(errorFile)

		await attachStreams(
			volumeContainer,
			process.stdin,
			stdoutStream,
			stderrStream,
		)

		await volumeContainer.start()
		await volumeContainer.wait()

		const original = await fs.readFile(inputFile)
		const copy = await fs.readFile(outputFile)
		expect(original).toEqual(copy)

		const error = await fs.readFile(errorFile)
		expect(Buffer.byteLength(error)).toEqual(0)

		await removeContainer(volumeContainer)
	})

	it('stops a specified container', async () => {
		const unendingContainer = await createContainer(
			docker,
			testImage,
			['/bin/cat', '/dev/urandom'],
			[],
		)

		await unendingContainer.start()
		const containersBefore = await listContainers(docker)
		expect(
			containersBefore.some((cont) => cont.Id === unendingContainer.id),
		).toBeTruthy()

		await stopContainer(unendingContainer)
		const containersAfter = await listContainers(docker)
		expect(
			containersAfter.some((cont) => cont.Id === unendingContainer.id),
		).toBeFalsy()

		await removeContainer(unendingContainer)
	}, 60000)
})
