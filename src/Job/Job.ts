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
	 * Get this job's target.
	 *
	 * The target is the resulting file.
	 *
	 * @returns This target.
	 */
	getTarget(): string

	/**
	 * Gets this Job's prerequisite Jobs as an iterable.
	 *
	 * Returns an iterable to prevent modifying the prerequisites directly.
	 *
	 * @returns An iterable that iterates over this Job's prerequisite Jobs.
	 */
	getPrerequisiteJobsIterable(): Iterable<Job>

	/**
	 * Gets this Job's prerequisite files as an iterable.
	 *
	 * Returns an iterable to prevent modifying the prerequisites directly.
	 *
	 * @returns An iterable that iterates over this Job's prerequisite files.
	 */
	getPrerequisiteFilesIterable(): Iterable<string>

	/**
	 * Gets the number of prerequisites that this Job has.
	 *
	 * @returns The number of prerequisites.
	 */
	getNumPrerequisiteJobs(): number

	/**
	 * Returns the commands to run (in-order and synchronously) that will result.
	 */
	getCommands(): Readonly<string[]>

	/**
	 * Gets the environment this job must run under.
	 *
	 * @returns A recipe for the job's runtime environment.
	 */
	getEnvironment(): Readonly<JobEnv>

	/**
	 * Sets the environment this job must run under.
	 *
	 * @deprecated This object should not be able to be changed. I'm adding this for the purpose of dev speed.
	 */
	setEnvironment(environment: JobEnv): void
}
