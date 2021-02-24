import Dockerode from 'dockerode'
import { ServerChannel } from 'ssh2'

import { Duplex } from 'stream'

import { dockerRunJob } from '../../src/Daemon/DockerRunJob'
import { JobRequest } from '../../src/Network/JobRequest'

const PULL_TIMEOUT_MS = 60000

const REQUEST: JobRequest = Object.freeze({
	image: 'buildpack-deps:bullseye',
	target: 'all',
})

const MAKE_EXIT_CODE = 2
const MAKE_STDOUT = ''
const MAKE_STDERR = `make: *** No rule to make target '${REQUEST.target}'.  Stop.\n`

class SpyDuplex extends Duplex {
	askedForBytes = 0

	recvChunks: Buffer[] = []

	// eslint-disable-next-line no-underscore-dangle, class-methods-use-this
	_read(size: number) {
		this.askedForBytes += size
	}

	// eslint-disable-next-line no-underscore-dangle
	_write(
		chunk: string | Buffer,
		encoding: BufferEncoding,
		callback: () => void,
	) {
		const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)
		this.recvChunks.push(buf)
		callback()
	}
}

describe('dockerRunJob', () => {
	const docker = new Dockerode()
	const runJob = dockerRunJob(docker)

	it(
		'returns the correct data and exit status for a nonexistent target',
		async () => {
			// Arrange
			const channel = new SpyDuplex() as ServerChannel & SpyDuplex
			const stderr = new SpyDuplex()
			Object.assign(channel, {
				stdin: channel,
				stdout: channel,
				stderr,
				exit: jest.fn(),
			})

			// Act
			await runJob(REQUEST, channel)

			// Assert
			expect(Buffer.concat(channel.recvChunks)).toEqual(
				Buffer.from(MAKE_STDOUT),
			)
			expect(Buffer.concat(stderr.recvChunks)).toEqual(Buffer.from(MAKE_STDERR))
			expect(channel.exit).toHaveBeenCalledWith(MAKE_EXIT_CODE)
		},
		PULL_TIMEOUT_MS,
	)
})
