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
	 * Returns the commands to run (in-order and synchronously) that will result.
	 */
	getCommands(): string[]
}
