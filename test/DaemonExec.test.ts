import * as Docker from 'dockerode'

import { promises as fs, createWriteStream } from 'fs'

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

describe('DaemonExec', () => {
	let container: Docker.Container
	let directory: string
	let target: string

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
		const volumes: VolumeDefinition[] = [
			{ fromPath: process.cwd(), toPath: '/test' },
		]
		container = await createContainer(
			docker,
			testImage,
			['/bin/cat', '/test/package.json'],
			volumes,
		)
		expect(container).toBeDefined()
		expect(container.id).toBeDefined()
	})

	it('attaches streams to a specified container', async () => {
		directory = await fs.mkdtemp(join(tmpdir(), 'test'))
		target = resolve(directory, 'package.json')
		const stdoutStream: NodeJS.WritableStream = createWriteStream(target)
		await attachStreams(container, process.stdin, stdoutStream, process.stderr)
	})

	it('runs a specified container', async () => {
		await container.start()
		const data: ExpectedStatus = await (container.wait() as Promise<ExpectedStatus>)
		expect(data).toBeDefined()
		expect(data.Error).toBeNull()
		expect(data.StatusCode).toBe(0)

		const original = await fs.readFile('package.json')
		const copy = await fs.readFile(target)
		expect(original).toEqual(copy)
		await removeContainer(container)
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
