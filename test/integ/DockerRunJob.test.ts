import Dockerode from 'dockerode'
import { ServerChannel } from 'ssh2'

import { resolve, basename } from 'path'

import { SpyDuplex } from '../util/SpyDuplex'
import { MockMakefile } from '../util/MockMakefile'

import { dockerRunJob } from '../../src/Daemon/DockerRunJob'
import { JobRequest } from '../../src/Network/JobRequest'

/**
 * The directory name to use for the Docker volume.
 * This works best if the tests are always run from the project root.
 * Unlike in normal (non-testing) operation, the directory won't be cleared afterwards.
 */
const WORKING_DIR = resolve('output', basename(__filename))

/**
 * The name of a Docker image that has GNU Make in $PATH.
 */
const DOCKER_IMAGE = 'buildpack-deps:bullseye'

/**
 * The maximum time to spend waiting for {@link IMAGE_GNU_MAKE} to download.
 */
const PULL_TIMEOUT_MS = 60000

/**
 * A Makefile that converts the case of one file.
 */
const INPUT_DATA = 'Alex\nErl\nParamjot\nRohan\nRohit\nYash\n'
const MAKEFILE = new MockMakefile(
	'Makefile',
	'upcased.txt',
	{ 'names.txt': INPUT_DATA },
	['tr [[:lower:]] [[:upper:]] <"$<" >"$@"'],
)

/**
 * Request for a target that exercises {@link MAKEFILE}.
 */
const REQUEST_XCASE: JobRequest = Object.freeze({
	image: DOCKER_IMAGE,
	target: MAKEFILE.output,
})

/**
 * Request for a target that doesn't exist in {@link MAKEFILE}.
 */
const REQUEST_NOTARGET: JobRequest = Object.freeze({
	image: DOCKER_IMAGE,
	target: 'all',
})

/**
 * Expected output fragments of Make when asked to build a nonexistent target.
 */
const MAKE_NOTARGET = {
	code: 2,
	stdout: 'make: Entering directory',
	stderr: `make: *** No rule to make target '${REQUEST_NOTARGET.target}'.  Stop.\n`,
}

describe('dockerRunJob', () => {
	const docker = new Dockerode()
	const runJob = dockerRunJob(docker)

	// Set up the working directory with test fixtures.
	beforeAll(() => MAKEFILE.write(WORKING_DIR))

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
			await runJob(REQUEST_NOTARGET, WORKING_DIR, channel)

			// Assert
			const outputs = Buffer.concat(channel.recvChunks)
			const errors = Buffer.concat(stderr.recvChunks)
			expect(outputs.toString()).toMatch(MAKE_NOTARGET.stdout)
			expect(errors.toString()).toMatch(MAKE_NOTARGET.stderr)
			expect(channel.exit).toHaveBeenCalledWith(MAKE_NOTARGET.code)
		},
		PULL_TIMEOUT_MS,
	)

	it('produces the correct output files using given input files', async () => {
		// Arrange
		const channel = new SpyDuplex() as ServerChannel & SpyDuplex
		Object.assign(channel, {
			stdin: channel,
			stdout: channel,
			stderr: new SpyDuplex(),
			exit: jest.fn(),
		})

		// Act
		await runJob(REQUEST_XCASE, WORKING_DIR, channel)

		// Assert
		const outputData = await MAKEFILE.inspect(WORKING_DIR)
		expect(outputData).toBe(INPUT_DATA.toUpperCase())
	})
})
