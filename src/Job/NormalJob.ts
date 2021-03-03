import { Job } from './Job'

/**
 * An implementation of {@link Job}.
 */
export class NormalJob implements Job {
	private prerequisiteJobs: Set<Job>

	private prerequisiteFiles: Set<string>

	private commands: string[]

	/**
	 * @param target - The target file that the Job will produce. Must be unique between jobs in the same dependency graph.
	 * @param commands - An optional array of the commands to run to build the target.
	 * @param prerequisiteJobs - An optional set containing all of this job's prerequisite Jobs. Defaults to no prerequisites.
	 * @param prerequisiteFiles - An optional set containing all of this job's prerequisite files. Defaults to no prerequisites.
	 */
	constructor(
		private readonly target: string,
		commands: string[] = [],
		prerequisiteJobs: Set<Job> = new Set(),
		prerequisiteFiles: Set<string> = new Set(),
	) {
		// Make copies so the caller can't directly access prerequisites. Encapsulation!
		this.prerequisiteJobs = new Set(prerequisiteJobs) // We don't need a deep copy because Jobs are immutable.
		this.prerequisiteFiles = new Set(prerequisiteFiles)
		this.commands = commands.slice()
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

		return `Job "${this.target}" depending on ${Array.from(
			this.prerequisiteJobs,
		)
			.map((prerequisite) => prerequisite.getTarget())
			.join(', ')}.`
	}

	public getCommands(): string[] {
		return this.commands
	}
}
