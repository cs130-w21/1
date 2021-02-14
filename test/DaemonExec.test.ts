import * as Docker from 'dockerode'

import { promises as fs, createWriteStream, mkdtempSync } from 'fs'

import { resolve, join } from 'path'

import { tmpdir } from 'os'
import {
	VolumeDefinition,
	listImages,
	//        listContainers,
	//        importImage,
	ensureImageImport,
	createContainer,
	attachStreams,
	//        stopContainer,
	removeContainer,
} from '../src/Daemon/DaemonExec'

interface ExpectedStatus {
	Error: unknown
	StatusCode: number
}

const docker = new Docker()
jest.setTimeout(300000)

describe('DaemonExec', () => {
	it('pulls a specified image', async () => {
		await ensureImageImport(docker, 'ubuntu:18.04')
		const imageInfos: Docker.ImageInfo[] = await listImages(docker)
		expect(
			imageInfos.some((info: Docker.ImageInfo) =>
				info.RepoTags.some((tag: string) => tag === 'ubuntu:18.04'),
			),
		).toBeTruthy()
	})
	it('creates a specified container', async () => {
		await ensureImageImport(docker, 'ubuntu:18.04')
		const volume: VolumeDefinition[] = [
			{ fromPath: process.cwd(), toPath: '/test' },
		]
		const container: Docker.Container = await createContainer(
			docker,
			'ubuntu:18.04',
			['/bin/ls', '/test'],
			volume,
		)
		expect(container).toBeDefined()
		expect(container.id).toBeDefined()
		await removeContainer(container)
	})
	it('runs a specified container', async () => {
		await ensureImageImport(docker, 'ubuntu:18.04')
		const volume: VolumeDefinition[] = [
			{ fromPath: process.cwd(), toPath: '/test' },
		]
		const container: Docker.Container = await createContainer(
			docker,
			'ubuntu:18.04',
			['/bin/cat', '/test/package.json'],
			volume,
		)
		expect(container).toBeDefined()
		expect(container.id).toBeDefined()

		const directory = mkdtempSync(join(tmpdir(), 'test'))
		const target = resolve(directory, 'package.json')
		const stdoutStream: NodeJS.WritableStream = createWriteStream(target)

		await attachStreams(container, process.stdin, stdoutStream, process.stderr)
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
})
