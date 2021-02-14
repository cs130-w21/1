import * as Docker from 'dockerode'
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
		// TODO: specify stdoutStream and stderrStream to check output
		await attachStreams(
			container,
			process.stdin,
			process.stdout,
			process.stderr,
		)
		await container.start()
		const data: ExpectedStatus = await (container.wait() as Promise<ExpectedStatus>)
		expect(data).toBeDefined()
		expect(data.Error).toBeNull()
		expect(data.StatusCode).toBe(0)
		await removeContainer(container)
	})
})
