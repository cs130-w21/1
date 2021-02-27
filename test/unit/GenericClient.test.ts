import { once } from 'events'
import { MockProxy, mock } from 'jest-mock-extended'
import { mocked } from 'ts-jest/utils'

import { Client, JobResult } from '../../src/Client/Client'
import { GenericClient } from '../../src/Client/GenericClient'
import { Connection, ConnectionFactory } from '../../src/Client/Connection'
import { JobOrderer } from '../../src/JobOrderer/JobOrderer'
import { HeapJobOrderer } from '../../src/JobOrderer/HeapJobOrderer'
import { NormalJob } from '../../src/Job/NormalJob'
import { Job } from '../../src/Job/Job'

const MOCK_HOST = 'example.com'
const MOCK_PORT = 1337

const BAD_RESULT = mock<JobResult>({ status: 1 })
const GOOD_RESULT = mock<JobResult>({ status: 0 })

describe('GenericClient', () => {
	it('connects to a newly introduced daemon', () => {
		// Arrange
		const connect = jest.fn().mockResolvedValue(undefined)
		const client: Client = new GenericClient(connect, undefined)

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
		const orderer: JobOrderer = new HeapJobOrderer([job])
		const client: Client = new GenericClient(connect, orderer)

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
		const orderer: JobOrderer = new HeapJobOrderer([job])
		const client: Client = new GenericClient(connect, orderer)

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
		const orderer: JobOrderer = new HeapJobOrderer([job])
		const client: Client = new GenericClient(connect, orderer)

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
		const orderer: JobOrderer = new HeapJobOrderer([goodJob])
		const client: Client = new GenericClient(connect, orderer)

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

		const orderer: JobOrderer = new HeapJobOrderer([])
		const client: Client = new GenericClient(connect, orderer)

		// Act
		client.introduce(MOCK_HOST, MOCK_PORT)
		await once(client, 'done')

		// Assert
		expect(daemon.end).toHaveBeenCalledTimes(1)
	})

	it('distributes independent jobs to multiple daemons', async () => {
		// Arrange
		const workerCount = 3
		const connect = mocked<ConnectionFactory>(jest.fn())

		const daemons: MockProxy<Connection>[] = []
		const jobs: Job[] = []
		for (let i = 0; i < workerCount; ++i) {
			const daemon = mock<Connection>()
			daemon.run.mockResolvedValueOnce(GOOD_RESULT)
			connect.mockResolvedValueOnce(daemon)
			daemons.push(daemon)
			jobs.push(new NormalJob(i.toString()))
		}

		const orderer: JobOrderer = new HeapJobOrderer(jobs)
		const client: Client = new GenericClient(connect, orderer)

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
