import { Job } from '../Job/Job'
import { Request } from '../Network'

/**
 * Build a network request to trigger the specified job.
 * @param job - The job to be triggered.
 * @returns The appropriate network request from client to daemon.
 */
export function jobToJobRequest(job: Job): Request {
	const image = job.getEnvironment().dockerImage
	return { action: 'job', image, target: job.getTarget() }
}

/**
 * Build a network request to get build artifacts for the given job.
 * @param job - The job to get the artifacts for.
 * @returns The appropriate network request from client to daemon.
 */
export function jobToGetArtifacts(job: Job): Request {
	return { action: 'get', files: [job.getTarget()] }
}

/**
 * Build a network request to initiate pushing input files for the given job.
 * @param job - The job to push inputs for.
 * @returns The appropriate network request from client to daemon.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function jobToPushInputs(job: Job): Request {
	return { action: 'put' }
}
