import { Job } from './Job'

/**
 * A job for a Daemon to complete.
 */
export class NormalJob implements Job {
	public incompletePrerequisites: Set<NormalJob>

	public name: string

	/**
	 * @param name - The job's name. Must be unique between jobs in the same dependency graph.
	 * @param prerequisites - An optional array of jobs that must be completed before this job can start.
	 */
	constructor(name: string, prerequisites: NormalJob[] = []) {
		this.name = name
		this.incompletePrerequisites = new Set(prerequisites)
	}

	/**
	 * @returns Whether this job has any incomplete prerequisites.
	 */
	public isSource(): boolean {
		return this.incompletePrerequisites.size === 0
	}

	/**
	 * JavaScript calls this function whenever Job is casted to a string.
	 *
	 * @returns This job's name.
	 */
	public toString(): string {
		if (this.incompletePrerequisites.size === 0) {
			return `Independent job ${this.name}.`
		}

		return `Job "${this.name}" depending on ${Array.from(
			this.incompletePrerequisites,
		)
			.map((prerequisite) => prerequisite.name)
			.join(', ')}.`
	}
}
