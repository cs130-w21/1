import { Job } from './Job'

/**
 * An implementation of {@link Job}.
 */
export class NormalJob implements Job {
	/**
	 * @param name - The job's name. Must be unique between jobs in the same dependency graph.
	 * @param prerequisites - An optional set containing all of this job's prerequisites. Defaults to no prerequisites.
	 */
	constructor(
		private readonly name: string,
		private readonly prerequisites: Set<Job> = new Set(),
	) {}

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
}
