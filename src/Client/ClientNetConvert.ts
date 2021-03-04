import { Job } from '../Job/Job'
import { JobRequest } from '../Network'

/**
 * Convert a {@link Job} (controller world) to a {@link JobRequest} (network world).
 * That these types don't share an interface is a historical accident.
 * @param job - The input job.
 * @returns The converted job request.
 */
export function jobToRequest(job: Job): JobRequest {
	return { image: job.getEnvironment().dockerImage, target: job.getTarget() }
}
