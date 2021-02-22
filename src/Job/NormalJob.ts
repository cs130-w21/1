import { Job } from './Job'

/**
 * An implementation of {@link Job}.
 */
export class NormalJob implements Job {
	private prerequisites: Set<Job>

	/**
	 * @param target - The job's name. Must be unique between jobs in the same dependency graph.
	 * @param prerequisites - An optional set containing all of this job's prerequisites. Defaults to no prerequisites.
	 */
	constructor(
		private readonly target: string,
		private readonly commands: string[] = [],
		prerequisites: Set<Job> = new Set(),
	) {
		this.prerequisites = new Set(prerequisites) // Make a copy so the caller can't directly access prerequisites. Encapsulation!
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
			return `Source job ${this.target}.`
		}

		return `Job "${this.target}" depending on ${Array.from(this.prerequisites)
			.map((prerequisite) => prerequisite.getTarget())
			.join(', ')}.`
	}

	public getCommands(): string[] {
		return this.commands
	}
}
