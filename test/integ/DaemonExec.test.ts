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
} from '../../src/Daemon/DaemonExec'

interface ExpectedStatus {
	Error: unknown
	StatusCode: number
}

const DOCKER = new Docker()
const TEST_IMAGE = 'ubuntu:18.04'
const BOGUS_IMAGE = 'lskjflskjflsdkfjslkfjsdlfsdjflksdj'
const INPUT_FILE = 'package.json'

describe('DaemonExec', () => {
	let container: Docker.Container
	let tempDir: string
	let outputFile: string
	let errorFile: string

	it('pulls a new image', async () => {
		const initialInfos = await listImages(DOCKER)
		if (
			initialInfos.some((info) =>
				info.RepoTags.some((tag) => tag === TEST_IMAGE),
			)
		) {
			// if image is already imported, remove it
			const image = DOCKER.getImage(TEST_IMAGE)
			await image.remove()
		}

		await ensureImageImport(DOCKER, TEST_IMAGE)
		const newInfos = await listImages(DOCKER)

		expect(
			newInfos.some((info) => info.RepoTags.some((tag) => tag === TEST_IMAGE)),
		).toBeTruthy()
	}, 60000)

	it('pulls an existing image', async () => {
		await ensureImageImport(DOCKER, TEST_IMAGE)
		const newInfos = await listImages(DOCKER)

		expect(
			newInfos.some((info) => info.RepoTags.some((tag) => tag === TEST_IMAGE)),
		).toBeTruthy()
	})

	it('fails pulling a nonexistent image', async () => {
		await expect(ensureImageImport(DOCKER, BOGUS_IMAGE)).rejects.toThrow()
	})

	it('creates a specified container', async () => {
		container = await createContainer(DOCKER, TEST_IMAGE, ['/bin/cat'], [])
		expect(container.id).toBeDefined()
	})

	it('attaches streams to a specified container', async () => {
		// inputs package.json to stdin, gets stdout and stderr in temp directory

		tempDir = await fs.mkdtemp(join(tmpdir(), 'test'))

		const stdinStream: NodeJS.ReadableStream = createReadStream(INPUT_FILE)

		outputFile = resolve(tempDir, INPUT_FILE)
		const stdoutStream: NodeJS.WritableStream = createWriteStream(outputFile)

		errorFile = resolve(tempDir, 'error')
		const stderrStream: NodeJS.WritableStream = createWriteStream(errorFile)

		const stream = await attachStreams(
			container,
			stdinStream,
			stdoutStream,
			stderrStream,
		)

		// This is to get rid of a warning in Jest
		// stream should always be defined at this point in the code
		expect(stream).toBeDefined()
	})

	it('runs a specified container and gives an end status', async () => {
		await container.start()

		const data: ExpectedStatus = await (container.wait() as Promise<ExpectedStatus>)

		expect(data.Error).toBeNull()
		expect(data.StatusCode).toBe(0)
	})

	it('writes the correct data to the streams', async () => {
		const original = await fs.readFile(INPUT_FILE)
		const copy = await fs.readFile(outputFile)
		expect(original.equals(copy)).toBeTruthy()

		const error = await fs.readFile(errorFile)
		expect(Buffer.byteLength(error)).toBe(0)
	})

	it('removes a specified container', async () => {
		await removeContainer(container)
		await expect(container.start()).rejects.toThrow()
	})

	it('creates and runs containers with volumes and gives correct outputs', async () => {
		// make volumes from current directory and temporary directory
		const volumes: VolumeDefinition[] = [
			{ fromPath: process.cwd(), toPath: '/input' },
			{ fromPath: tempDir, toPath: '/output' },
		]

		const volumeContainer = await createContainer(
			DOCKER,
			TEST_IMAGE,
			['/bin/cp', `/input/${INPUT_FILE}`, `/output/${INPUT_FILE}`],
			volumes,
		)

		await volumeContainer.start()
		await volumeContainer.wait()

		// volumes should have the correct files copied over
		const original = await fs.readFile(INPUT_FILE)
		const copy = await fs.readFile(resolve(tempDir, INPUT_FILE))
		expect(original.equals(copy)).toBeTruthy()

		await removeContainer(volumeContainer)
	})

	it('detects and stops a running container', async () => {
		const unendingContainer = await createContainer(
			DOCKER,
			TEST_IMAGE,
			['/bin/cat', '/dev/urandom'],
			[],
		)

		// start the containers and see if detected
		await unendingContainer.start()
		const containersBefore = await listContainers(DOCKER)
		expect(
			containersBefore.some((cont) => cont.Id === unendingContainer.id),
		).toBeTruthy()

		// stop the container and see if detected
		await stopContainer(unendingContainer)
		const containersAfter = await listContainers(DOCKER)
		expect(
			containersAfter.some((cont) => cont.Id === unendingContainer.id),
		).toBeFalsy()

		await removeContainer(unendingContainer)
	}, 60000)
})
