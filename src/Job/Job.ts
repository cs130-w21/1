/**
 * A description of the runtime environment required by a Job.
 */
export interface JobEnv {
	/**
	 * The name:version specifier of the Docker image required by the job.
	 */
	dockerImage: string
}

/**
 * A job for a Daemon to complete.
 */
export interface Job {
	/**
	 * Get this job's name.
	 *
	 * This method may be removed in the future because Jobs may no longer have names.
	 *
	 * @experimental
	 * @returns This job's name.
	 */
	getName(): string

	/**
	 * Gets this Job's prerequisites as an iterable.
	 *
	 * Returns an iterable to prevent modifying the prerequisites directly.
	 *
	 * @returns An iterable that iterates over this Job's prerequisites.
	 */
	getPrerequisitesIterable(): Iterable<Job>

	/**
	 * Gets the number of prerequisites that this Job has.
	 *
	 * @returns The number of prerequisites.
	 */
	getNumPrerequisites(): number

	/**
	 * Get the environment this job must run under.
	 *
	 * @returns A recipe for the job's runtime environment.
	 */
	getEnvironment(): JobEnv
}
