import { JobEnv, Job } from './Job'

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
	private prerequisites: Set<Job>

	/**
	 * @param name - The job's name. Must be unique between jobs in the same dependency graph.
	 * @param prerequisites - A set containing all of this job's prerequisites. Defaults to no prerequisites.
	 * @param environment - A description of the job's runtime environment. For forwards compatibility, always provide this parameter. Defaults to a Docker image containing GNU Make.
	 */
	constructor(
		private readonly name: string,
		prerequisites: Set<Job> = new Set(),
		private environment: JobEnv = DEFAULT_ENV,
	) {
		// Make a copy so the caller can't directly access prerequisites. Encapsulation!
		this.prerequisites = new Set(prerequisites)
	}

	/**
	 * @returns The job's name.
	 */
	public getName(): string {
		return this.name
	}

	/**
	 * Uses Set's native values() function to get an iterable of prerequisites.
	 *
	 * @returns An iterable that iterates over the prerequisites Set.
	 */
	public getPrerequisitesIterable(): Iterable<Job> {
		return this.prerequisites.values()
	}

	/**
	 * Returns the number of prerequisites using Set's native size property.
	 */
	public getNumPrerequisites(): number {
		return this.prerequisites.size
	}

	/**
	 * JavaScript calls this function whenever Job is casted to a string.
	 *
	 * @returns This job's name.
	 */
	public toString(): string {
		if (this.prerequisites.size === 0) {
			return `Source job ${this.name}.`
		}

		return `Job "${this.name}" depending on ${Array.from(this.prerequisites)
			.map((prerequisite) => prerequisite.getName())
			.join(', ')}.`
	}

	/**
	 * Getter for the environment this job must run under.
	 */
	public getEnvironment(): JobEnv {
		return this.environment
	}
}
