import * as Docker from 'dockerode'
import {
	//	VolumeDefinition,
	listImages,
	//        listContainers,
	//        importImage,
	ensureImageImport,
	//        createContainer,
	//        attachStreams,
	//        stopContainer,
	//        removeContainer,
} from '../src/Daemon/DaemonExec'

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
})
