import {
	jobToJobRequest,
	jobToGetArtifacts,
	jobToPushInputs,
} from '../../src/Client/ClientNetConvert'
import { Job } from '../../src/Job/Job'
import { NormalJob } from '../../src/Job/NormalJob'

const MOCK_TARGET = 'all'
const MOCK_IMAGE = 'fake:latest'

function createMockJob(): Job {
	return new NormalJob({
		target: MOCK_TARGET,
		environment: { dockerImage: MOCK_IMAGE },
		commands: [],
	})
}

describe('ClientNetConvert', () => {
	it('correctly converts a job to a job-trigger request', () => {
		// Arrange
		const job: Job = createMockJob()

		// Act
		const request = jobToJobRequest(job)

		// Assert
		expect(request).toEqual({
			action: 'job',
			image: MOCK_IMAGE,
			target: MOCK_TARGET,
		})
	})

	it('correctly converts a job to a get-artifacts request', () => {
		// Arrange
		const job: Job = createMockJob()

		// Act
		const request = jobToGetArtifacts(job)

		// Assert
		expect(request).toEqual({
			action: 'get',
			files: [MOCK_TARGET],
		})
	})

	it('correctly converts a job to a push-inputs request', () => {
		// Arrange
		const job: Job = createMockJob()

		// Act
		const request = jobToPushInputs(job)

		// Assert
		expect(request).toEqual({
			action: 'put',
		})
	})
})
