import { Job, JobEnv } from './Job'

/**
 * An interface describing options for a {@link NormalJob}.
 *
 * target: The target file that the Job will produce. Must be unique between jobs in the same dependency graph.
 * commands: An array of the commands to run to build the target.
 * prerequisiteJobs: A set containing all of this job's prerequisite Jobs.
 * prerequisiteFiles: A set containing all of this job's prerequisite files
 * environment: A description of the job's runtime environment. For forwards compatibility, always provide this parameter.
 */
export interface NormalJobOptions {
	target: string
	commands: string[]
	prerequisiteJobs?: Set<Job>
	prerequisiteFiles?: Set<string>
	environment?: JobEnv
}
