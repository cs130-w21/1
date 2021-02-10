import { Job } from './Job'

/**
 * A job for a Daemon to complete.
 */
export class NormalJob implements Job {
	/**
	 * @param name - The job's name. Must be unique between jobs in the same dependency graph.
	 * @param prerequisites - An optional array of jobs that must be completed before this job can start.
	 */
	constructor(
		private name: string,
		private prerequisites: Set<Job> = new Set(),
	) {}

	public getName(): string {
		return this.name
	}

	public getPrerequisitesIterable(): Iterable<Job> {
		return this.prerequisites.values()
	}

	/**
	 * @returns Whether this job has any incomplete prerequisites.
	 */
	public isSource(): boolean {
		return this.prerequisites.size === 0
	}

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
