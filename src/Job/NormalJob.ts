import { JobEnv, Job } from './Job'
import { NormalJobOptions } from './NormalJobOptions'

/**
 * The hard-coded Docker image for all {@link NormalJob} instances.
 * This is a terrible idea, but needed for backwards compatibility.
 * {@link NormalJob} was created without Docker support and got used heavily throughout the codebase.
 * @deprecated Make {@link JobEnv} a required parameter to {@link NormalJob}.
 */
const DEFAULT_ENV: JobEnv = Object.freeze({
	dockerImage: 'buildpack-deps:bullseye',
})

/**
 * An implementation of {@link Job}.
 */
export class NormalJob implements Job {
	private prerequisiteJobs: Set<Job>

	private prerequisiteFiles: Set<string>

	private commands: string[]

	private target: string

	private environment: JobEnv

	/**
	 * @param options - the settings for this Job.
	 *
	 * The default for options.prerequisiteJobs is the empty set.
	 *
	 * The default for options.prerequisiteFiles is the empty set.
	 *
	 * The default for options.environment is a Docker image containing GNU Make: {@link DEFAULT_ENV}. For forwards compatibility, always provide this parameter.
	 */
	constructor(options: NormalJobOptions) {
		// Make copies so the caller can't directly access prerequisites. Encapsulation!
		this.prerequisiteJobs = new Set(options.prerequisiteJobs) // We don't need a deep copy because Jobs are immutable.
		this.prerequisiteFiles = new Set(options.prerequisiteFiles)
		this.commands = options.commands.slice()
		this.target = options.target
		this.environment = options.environment || DEFAULT_ENV // todo change
	}

	/**
	 * @returns The job's name.
	 */
	public getTarget(): string {
		return this.target
	}

	/**
	 * Uses Set's native values() function to get an iterable of prerequisites.
	 *
	 * @returns An iterable that iterates over the prerequisites Set.
	 */
	public getPrerequisiteJobsIterable(): Iterable<Job> {
		return this.prerequisiteJobs.values()
	}

	public getPrerequisiteFilesIterable(): Iterable<string> {
		return this.prerequisiteFiles.values()
	}

	/**
	 * Returns the number of prerequisites using Set's native size property.
	 */
	public getNumPrerequisites(): number {
		return this.prerequisiteJobs.size
	}

	/**
	 * JavaScript calls this function whenever Job is casted to a string.
	 *
	 * @returns This job's name.
	 */
	public toString(): string {
		if (this.prerequisiteJobs.size === 0) {
			return `Source job ${this.target}.`
		}

		return `Job with target "${this.target}". Depends on targets "${Array.from(
			this.prerequisiteJobs,
		)
			.map((prerequisite) => prerequisite.getTarget())
			.join('", "')}". Depends on files "${Array.from(
			this.prerequisiteFiles,
		).join('", "')}".`
	}

	public getCommands(): string[] {
		return this.commands
	}

	/**
	 * Getter for the environment this job must run under.
	 */
	public getEnvironment(): JobEnv {
		return this.environment
	}
}
