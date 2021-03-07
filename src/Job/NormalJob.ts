import { cloneDeep } from 'lodash'
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
		this.environment = options.environment
			? cloneDeep(options.environment)
			: DEFAULT_ENV
	}

	/**
	 * @returns This job's target.
	 */
	public getTarget(): string {
		return this.target
	}

	/**
	 * @returns This job's name.
	 */
	public getName(): string {
		return this.target
	}

	/**
	 * Uses Set's native values() function to get an iterable of prerequisites.
	 *
	 * @returns An iterable that iterates over the prerequisiteJobs Set.
	 */
	public getPrerequisiteJobsIterable(): Iterable<Job> {
		return this.prerequisiteJobs.values()
	}

	/**
	 * Uses Set's native values() function to get an iterable of prerequisites.
	 *
	 * @returns An iterable that iterates over the prerequisiteFiles Set.
	 */
	public getPrerequisiteFilesIterable(): Iterable<string> {
		return this.prerequisiteFiles.values()
	}

	/**
	 * Gets this Job's dependencies (its prerequisites, recursively)
	 *
	 * @returns a iterable containing a deep scan of the Job's prerequisites.
	 */
	public getDeepPrerequisitesIterable(): Array<Job> {
		let childrenPrereqs: Array<Job> = []
		for (const prereqJob of this.getPrerequisiteJobsIterable()) {
			childrenPrereqs = childrenPrereqs.concat(
				prereqJob.getDeepPrerequisitesIterable(),
			)
		}
		childrenPrereqs = childrenPrereqs.concat(
			Array.from(this.getPrerequisiteJobsIterable()),
		)
		//  childrenPrereqs.push(this)
		return childrenPrereqs
	}

	/**
	 * Returns the number of prerequisites using Set's native size property.
	 */
	public getNumPrerequisiteJobs(): number {
		return this.prerequisiteJobs.size
	}

	/**
	 * JavaScript calls this function whenever Job is casted to a string.
	 *
	 * @returns A string detailing this job's target, as well as any prerequisite jobs or files.
	 */
	public toString(): string {
		let description = ''

		if (this.getNumPrerequisiteJobs() === 0) {
			description += `Source job with target ${this.target}.`
		} else {
			description += `Job with target "${
				this.target
			}". Depends on targets "${Array.from(this.prerequisiteJobs)
				.map((prerequisite) => prerequisite.getTarget())
				.join('", "')}".`
		}

		if (this.prerequisiteFiles.size > 0) {
			description += ` Depends on files "${Array.from(
				this.prerequisiteFiles,
			).join('", "')}".`
		}

		return description
	}

	/**
	 * Getter for this job's environment.
	 */
	public getCommands(): Readonly<string[]> {
		Object.freeze(this.commands)
		return this.commands
	}

	/**
	 * Getter for the environment this job must run under.
	 */
	public getEnvironment(): Readonly<JobEnv> {
		Object.freeze(this.environment)
		return this.environment
	}

	/**
	 * Getter for the environment this job must run under.
	 *
	 * @deprecated Should be removed soon.
	 */
	public setEnvironment(env: JobEnv): void {
		this.environment = { dockerImage: env.dockerImage }
	}
}
