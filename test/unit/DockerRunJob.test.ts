import Dockerode, { Container, ImageInfo } from 'dockerode'
import { mock } from 'jest-mock-extended'
import { ServerChannel } from 'ssh2'
import { ContainerWaitOK } from '../../src/Daemon/DockerAPI'

import { dockerRunJob } from '../../src/Daemon/DockerRunJob'
import { JobRequest } from '../../src/Network'

const REQUEST: JobRequest = Object.freeze({
	image: 'buildpack-deps',
	target: 'all',
})

describe('dockerRunJob', () => {
	const docker = mock<Dockerode>()
	const channel = mock<ServerChannel>()

	// Always pretend the image already exists
	const imageInfo = mock<ImageInfo>({ RepoTags: [REQUEST.image] })
	docker.listImages.mockResolvedValue([imageInfo])

	const container = mock<Container>({ modem: { demuxStream: jest.fn() } })
	docker.createContainer.mockResolvedValue(container)

	it.todo('pulls the image')

	it('creates a new container', async () => {
		// Arrange
		const exitStatus: ContainerWaitOK = Object.freeze({ StatusCode: 42 })
		container.wait.mockResolvedValue(exitStatus)

		// Act
		await dockerRunJob(docker)(REQUEST, channel)

		// Assert
		expect(docker.createContainer).toHaveBeenCalled()
	})

	it.todo('attaches streams to container')
	it.todo('outputs exit status of container')
	it.todo('cleans up the container')
})
