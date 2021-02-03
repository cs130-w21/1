import * as bonjour from 'bonjour'
import { once } from 'events'

import { publishServer } from '../src/ZeroconfDaemon'
import { supplyClient } from '../src/ZeroconfClient'
import { createDaemon } from '../src/Daemon'
import { Client, Job, JobResult } from '../src/Client'
import { Http2Client } from '../src/Http2Client'
import { SERVICE_TYPE } from '../src/Constants'

const MOCK_SERVER_NAME = 'Junknet Integration Test'
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
