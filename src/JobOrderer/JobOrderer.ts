import { Job } from '../Job/Job'

/**
 * Orders Jobs in a valid topological sort.
 *
 * Does not necessarily preorder everything. Uses {@link popNextJob} to return just the nextJob.
 */
export interface JobOrderer {
	/**
	 * Get the next Job that can be run.
	 *
	 * If a Job is returned, it will be considered to be in progress.
	 *
	 * @returns The next Job to return, or null if there are no runnable Jobs.
	 */
	popNextJob(): Job | null

	/**
	 * Returns whether all Jobs in the dependency tree are completed.
	 *
	 * @returns true if all Jobs are completed, false otherwise.
	 */
	isDone(): boolean

	/**
	 * Mark job as failed, but not because of a job-internal error.
	 *
	 * I.e. if a job returns with a non-zero exit code, do not call this function with this job.
	 *
	 * This will mark the job to be retried.
	 *
	 * @param job - the job to mark completed.
	 */
	reportFailedJob(job: Job): void

	/**
	 * Mark job as completed (run succesfully).
	 *
	 * @param job - the job to mark completed.
	 */
	reportCompletedJob(job: Job): void
}
