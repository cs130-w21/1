import { once } from 'events'
import { mock } from 'jest-mock-extended'

import {
	Client,
	GenericClient,
	Connection,
	ConnectionFactory,
	Job,
	NormalJob,
	JobResult,
	HeapJobOrderer,
} from '../../src'

const MOCK_HOST = 'example.com'
const MOCK_PORT = 1337

const BAD_RESULT = mock<JobResult>({ status: 1 })
const GOOD_RESULT = mock<JobResult>({ status: 0 })

function create(connect: ConnectionFactory, ...jobs: Job[]): Client {
	return new GenericClient(connect, new HeapJobOrderer(jobs))
}

describe('GenericClient', () => {
	it('connects to a newly introduced daemon', () => {
		// Arrange
		const connect = jest.fn().mockResolvedValue(undefined)
		const client = create(connect)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)

		// Assert
		expect(connect).toHaveBeenCalledTimes(1)
		expect(connect).toHaveBeenCalledWith(MOCK_HOST, MOCK_PORT)
	})

	it('emits progress with the correct data when a job finishes', async () => {
		// Arrange
		const daemon = mock<Connection>()
		daemon.run.mockResolvedValue(GOOD_RESULT)
		const connect = jest.fn().mockResolvedValue(daemon)

		const job: Job = new NormalJob('root')
		const client = create(connect, job)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		const [done, result] = (await once(client, 'progress')) as [Job, JobResult]

		// Assert
		expect(done).toEqual(job)
		expect(result).toEqual(GOOD_RESULT)
	})

	it('runs jobs and emits done with the correct status', async () => {
		// Arrange
		const daemon = mock<Connection>()
		daemon.run.mockResolvedValue(GOOD_RESULT)
		const connect = jest.fn().mockResolvedValue(daemon)

		const job: Job = new NormalJob('root')
		const client = create(connect, job)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		const [success] = (await once(client, 'done')) as [boolean]

		// Assert
		expect(success).toBeTruthy()
		expect(daemon.run).toHaveBeenCalledTimes(1)
		expect(daemon.run).toHaveBeenCalledWith(job)
	})

	it('retries jobs that failed to complete', async () => {
		// Arrange
		const daemon = mock<Connection>()
		const connect = jest.fn().mockResolvedValue(daemon)

		const failCount = 3
		for (let i = 0; i < failCount; ++i) {
			daemon.run.mockRejectedValueOnce(new Error())
		}
		daemon.run.mockResolvedValueOnce(GOOD_RESULT)

		const job: Job = new NormalJob('root')
		const client = create(connect, job)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		const [success] = (await once(client, 'done')) as [boolean]

		// Assert
		expect(success).toBeTruthy()
		expect(daemon.run).toHaveBeenCalledTimes(failCount + 1)
		for (let i = 1; i <= failCount + 1; ++i) {
			expect(daemon.run).toHaveBeenNthCalledWith(i, job)
		}
	})

	it('does not run jobs after one fails with bad status', async () => {
		// Arrange
		const daemon = mock<Connection>()
		const connect = jest.fn().mockResolvedValue(daemon)
		daemon.run.mockResolvedValueOnce(BAD_RESULT)
		daemon.run.mockResolvedValueOnce(GOOD_RESULT)
		daemon.run.mockRejectedValueOnce(new Error())

		const badJob: Job = new NormalJob('bad')
		const goodJob: Job = new NormalJob('good', new Set([badJob]))
		const client = create(connect, goodJob)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		const [success] = (await once(client, 'done')) as [boolean]

		// Assert
		expect(success).toBeFalsy()
		expect(daemon.run).toHaveBeenCalledTimes(1)
		expect(daemon.run).toHaveBeenCalledWith(badJob)
	})

	it('closes connection when done', async () => {
		// Arrange
		const daemon = mock<Connection>()
		const connect = jest.fn().mockResolvedValue(daemon)
		const client = create(connect)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		await once(client, 'done')

		// Assert
		expect(daemon.end).toHaveBeenCalledTimes(1)
	})

	it('distributes independent jobs to multiple daemons', async () => {
		// Arrange
		const workerCount = 3
		const connect = jest.fn()

		const daemons: Connection[] = []
		for (let i = 0; i < workerCount; ++i) {
			const daemon = mock<Connection>()
			daemon.run.mockResolvedValueOnce(GOOD_RESULT)
			connect.mockResolvedValueOnce(daemon)
			daemons.push(daemon)
		}

		const jobs = daemons.map((_, i) => new NormalJob(i.toString()))
		const client = create(connect, ...jobs)

		// Act
		for (let i = 0; i < workerCount; ++i) {
			client.introduce(MOCK_HOST, MOCK_PORT)
		}
		await once(client, 'done')

		// Assert
		for (const daemon of daemons) {
			expect(daemon.run).toHaveBeenCalledTimes(1)
		}
	})
})
