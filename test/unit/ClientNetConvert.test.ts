import { jobToRequest } from '../../src/Client/ClientNetConvert'
import { JobEnv } from '../../src/Job/Job'
import { JobRequest } from '../../src/Network/JobRequest'
import { NormalJob } from '../../src/Job/NormalJob'

const MOCK_REQUEST: JobRequest = Object.freeze({
	target: 'job',
	image: 'fake:latest',
})

describe('jobToRequest', () => {
	it('correctly converts a job to a job request', () => {
		// Arrange
		const env: JobEnv = { dockerImage: MOCK_REQUEST.image }
		const job = new NormalJob({
			target: MOCK_REQUEST.target,
			commands: [],
			environment: env,
		})

		// Act
		const request = jobToRequest(job)

		// Assert
		expect(request).toEqual(MOCK_REQUEST)
	})
})
