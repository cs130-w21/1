import Dockerode, { Container } from 'dockerode'
import { ServerChannel } from 'ssh2'

import { strict as assert } from 'assert'

import { mock } from 'jest-mock-extended'
import { mocked } from 'ts-jest/utils'

import {
	ensureImageImport,
	createContainer,
	attachStreams,
} from '../../src/Daemon/DaemonExec'
import { ContainerWaitOK } from '../../src/Daemon/DockerAPI'
import { dockerRunJob } from '../../src/Daemon/DockerRunJob'
import { JobRequest } from '../../src/Network'

jest.mock('../../src/Daemon/DaemonExec')

const REQUEST: JobRequest = Object.freeze({
	image: 'buildpack-deps:bullseye',
	target: 'all',
})

describe('dockerRunJob', () => {
	// Arrange
	const docker = mock<Dockerode>()
	const channel = mock<ServerChannel>()

	const container = mock<Container>({ modem: { demuxStream: jest.fn() } })
	mocked(createContainer).mockResolvedValue(container)

	const goodExit: ContainerWaitOK = Object.freeze({ StatusCode: 42 })
	const badExit: ContainerWaitOK = Object.freeze({
		StatusCode: NaN,
		Error: Object.freeze({ Message: 'UNKNOWN FAILURE' }),
	})
	container.wait.mockResolvedValue(goodExit)

	// Act
	const runJob = dockerRunJob(docker)
	beforeAll(() => runJob(REQUEST, channel))

	it('pulls the image using a tested method', () => {
		// Assert
		expect(ensureImageImport).toHaveBeenCalledTimes(1)
		expect(ensureImageImport).toHaveBeenCalledWith(docker, REQUEST.image)
	})

	it('creates a new container using a tested method', () => {
		// Assert
		expect(createContainer).toHaveBeenCalledTimes(1)
		expect(createContainer).toHaveBeenCalledWith(
			docker,
			REQUEST.image,
			expect.anything(),
			expect.anything(),
		)
	})

	it('attaches streams to container using a tested method', () => {
		// Assert
		expect(attachStreams).toHaveBeenCalled()
	})

	it('outputs exit status of container and ends channel', () => {
		// Assert
		expect(channel.exit).toHaveBeenCalledWith(goodExit.StatusCode)
		expect(channel.end).toHaveBeenCalled()
	})

	it('cleans up the container', () => {
		// Assert
		expect(container.remove).toHaveBeenCalled()
	})

	it('fails if the container fails', () => {
		// Arrange
		container.wait.mockResolvedValue(badExit)

		// Act
		const promise = runJob(REQUEST, channel)

		// Assert
		assert(badExit.Error)
		return expect(promise).rejects.toThrow(badExit.Error.Message)
	})
})
