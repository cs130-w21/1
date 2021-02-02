import { assert } from 'console'
import { Job } from './Job'

/**
 * Manages a set of jobs that have to be run.
 */
export class JobOrderer {
	private sources: Set<Job> = new Set()
	private nonSources: Set<Job> = new Set()
	private inProgress: Set<Job> = new Set()
	private jobToDependents: Map<Job, Set<Job>> = new Map()

	/**
	 * Create the JobOrderer and inform it of the jobs to manage.
	 *
	 * @throws When one of the jobs has a prerequisite that is not one of the jobs, or is itself.
	 * @param jobs - The jobs to manage. They must have correctly populated prerequisites fields.
	 */
	constructor(jobs: Job[]) {
		// Initialize dependents map.
		jobs.forEach((job) => this.jobToDependents.set(job, new Set()))

		// Populate dependents map.
		jobs.forEach((job) => {
			job.incompletePrerequisites.forEach((prerequisite) => {
				if (prerequisite == job) {
					throw `Circular dependency: job ${job} has itself as a preqrequisite.`
				} else {
					const prerequisiteDependents = this.jobToDependents.get(prerequisite)

					if (prerequisiteDependents) {
						prerequisiteDependents.add(job)
					} else {
						throw `Job ${job} has prerequisite ${prerequisite} which was not passed to the constructor.`
					}
				}
			})
		})

		// Move sources to correct set.
		jobs.forEach((job) => {
			if (job.isSource()) {
				this.sources.add(job)
			} else {
				this.nonSources.add(job)
			}
		})
	}

	/**
	 * Returns the next job that the JobOrderer would choose to run.
	 * If there is no job that can be run, returns null.
	 *
	 * @returns The next job that would be run.
	 */
	public peekNextJob(): Job | null {
		if (this.sources.size) {
			return Array.from(this.sources.values()).reduce((job1, job2) => {
				const job1Dependents = this.jobToDependents.get(job1)
				const job2Dependents = this.jobToDependents.get(job2)

				if (!job1Dependents) {
					throw 'Job 1 is missing in the map'
				} else if (!job2Dependents) {
					throw 'Job 2 is missing in the map'
				} else {
					return job1Dependents.size > job2Dependents.size ? job1 : job2
				}
			})
		} else {
			return null
		}
	}

	/**
	 * Chooses the next job to run and returns it. Marks that job as in-progress.
	 * If there is no job that can be run, returns null.
	 *
	 * @returns The next job to run.
	 */
	public popNextJob(): Job | null {
		const nextJob = this.peekNextJob()

		if (nextJob) {
			this.sources.delete(nextJob)
			this.inProgress.add(nextJob)
		}

		return nextJob
	}

	/**
	 * Marks a job as completed.
	 * JobOrderer will update the dependency graph and then forget about this job.
	 *
	 * @param completedJob - The job that is completed.
	 */
	public reportCompletedJob(completedJob: Job): void {
		const dependents = this.jobToDependents.get(completedJob)

		if (dependents) {
			dependents.forEach((dependent) => {
				dependent.incompletePrerequisites.delete(completedJob)
				if (dependent.isSource()) {
					this.sources.add(dependent)
					this.nonSources.delete(dependent)
				}
			})
		} else {
			throw `We don't know about this job marked completed: ${completedJob}.`
		}

		this.inProgress.delete(completedJob)
	}

	/**
	 * Marks an in-progress job as failed.
	 * JobOrderer will try to run it again at some point.
	 *
	 * @param failedJob - The job that failed.
	 */
	public reportFailedJob(failedJob: Job): void {
		if (this.inProgress.has(failedJob)) {
			this.inProgress.delete(failedJob)
			assert(failedJob.isSource())
			this.sources.add(failedJob)
		} else {
			throw `We don't know about the job ${failedJob}.`
		}
	}

	/**
	 * @returns Whether all of the jobs are complete.
	 */
	public isDone(): boolean {
		return !(this.sources.size || this.nonSources.size || this.inProgress.size)
	}
}
