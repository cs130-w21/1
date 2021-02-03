import * as bonjour from 'bonjour'
import { once } from 'events'

import { publishServer } from '../src/ZeroconfDaemon'
import { supplyClient } from '../src/ZeroconfClient'
import { createDaemon } from '../src/Daemon'
import { Client, Job, JobResult } from '../src/Client'
import { Http2Client } from '../src/Http2Client'
import { SERVICE_TYPE } from '../src/Constants'

/**
 * A unique name on any LAN this integration test runs on.
 *
 * @remarks
 * Consider both the developers' homes and the CI/CD environment.
 */
const MOCK_SERVER_NAME = 'Junknet Integration Test'

/**
 * Mock jobs for the client to distribute to the daemons.
 */
const MOCK_CLIENT_JOBS = Object.freeze([
	'fifth',
	'fourth',
	'third',
	'second',
	'first',
])

/**
 * Predicts (accurately) what response the server should give for any job.
 *
 * @remarks
 * Since the prediction has to be correct, this test suite should use a mock server.
 * Moreover, this function needs to be kept in sync with that server.
 *
 * @param job - the job to mock the result for
 * @returns the same result the daemon would give for that job
 */
function mockResult(job: Job): JobResult {
	return `/${job.toUpperCase()}`
}

/**
 * Create a server and a Zeroconf wrapper, then connect the two.
 * Resolve once both are ready (i.e. the server is listening and published).
 *
 * @remarks
 * This needs better instrumentation, so we can debug failures in CI.
 *
 * @param zeroconf - a Zeroconf session
 */
async function bootServerAssembly(zeroconf: bonjour.Bonjour): Promise<void> {
	const server = createDaemon().listen()
	// TODO: watch for server error events (aside from before 'listening')?

	await once(server, 'listening')
	console.log(server.address())

	const service = await publishServer(
		zeroconf,
		SERVICE_TYPE,
		MOCK_SERVER_NAME,
		server,
	)
	console.log(service)
}

/**
 * Create a client and a Zeroconf wrapper, then connect the two.
 * Resolve once the client has completed all of its tasks.
 *
 * @remarks
 * This needs better instrumentation, so we can debug failures in CI.
 *
 * @param zeroconf - a Zeroconf session
 * @param onProgress - called on each job completion - @see {@link ClientEvents.progress}
 */
async function makeAndWaitForClient(
	zeroconf: bonjour.Bonjour,
	onProgress: (job: Job, data: JobResult) => void,
): Promise<void> {
	const client: Client = new Http2Client([...MOCK_CLIENT_JOBS])
	client.on('progress', onProgress)
	client.on('progress', console.log)
	supplyClient(zeroconf, client)
	await once(client, 'done')
}

describe('zero-config network discovery', () => {
	const zeroconf = bonjour()
	afterAll(() => zeroconf.destroy())

	it('works', async () => {
		// Arrange
		const watchProgress = jest.fn()

		// Act
		await bootServerAssembly(zeroconf)
		await makeAndWaitForClient(zeroconf, watchProgress)

		// Assert
		expect(watchProgress).toHaveBeenCalledTimes(MOCK_CLIENT_JOBS.length)
		for (const job of MOCK_CLIENT_JOBS) {
			expect(watchProgress).toHaveBeenCalledWith(job, mockResult(job))
		}
	})
})
