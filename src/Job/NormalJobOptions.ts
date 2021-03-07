import { Job, JobEnv } from './Job'

/**
 * An interface describing options for a {@link NormalJob}.
 */
export interface NormalJobOptions {
	/**
	 * The target file that the Job will produce. Must be unique between jobs in the same dependency graph.
	 */
	target: string

	/**
	 * The commands to run to build the target.
	 */
	commands: string[]

	/**
	 * All of this job's prerequisite Jobs.
	 */
	prerequisiteJobs?: Set<Job>

	/**
	 * All files needed by the job to run (eg. "sourceCodeToCompile.js").
	 */
	prerequisiteFiles?: Set<string>

	/**
	 * A description of the job's runtime environment. For forwards compatibility, always provide this parameter.
	 */
	environment?: JobEnv
}
