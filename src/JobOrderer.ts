import { Job } from './Job'
import { Heap } from 'heap-js'
import assert = require('assert')

/**
 * Manages a set of jobs that have to be run.
 */
export class JobOrderer {
	private sourcesHeap: Heap<Job>
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
		this.sourcesHeap = new Heap((job1, job2) => {
			const job1Dependents = this.jobToDependents.get(job1)
			const job2Dependents = this.jobToDependents.get(job2)

			assert(
				job1Dependents && job2Dependents,
				'Provided jobs are missing from map.',
			)

			return job2Dependents.size - job1Dependents.size
		})

		// Initialize dependents map.
		for (const job of jobs) {
			this.jobToDependents.set(job, new Set())
		}

		// Populate dependents map.
		for (const job of jobs) {
			for (const prerequisite of job.incompletePrerequisites) {
				if (prerequisite === job) {
					throw new Error(
						`Circular dependency: job ${job} has itself as a preqrequisite.`,
					)
				} else {
					const prerequisiteDependents = this.jobToDependents.get(prerequisite)

					if (prerequisiteDependents) {
						prerequisiteDependents.add(job)
					} else {
						throw new Error(
							`Job ${job} has prerequisite ${prerequisite} which was not passed to the constructor.`,
						)
					}
				}
			}
		}

		// Move sources to correct set.
		for (const job of jobs) {
			if (job.isSource()) {
				this.sourcesHeap.push(job)
			} else {
				this.nonSources.add(job)
			}
		}
	}

	/**
	 * Returns the next job that the JobOrderer would choose to run.
	 * If there is no job that can be run, returns null.
	 *
	 * @returns The next job that would be run.
	 */
	public peekNextJob(): Job | null {
		return this.sourcesHeap.peek() || null
	}

	/**
	 * Chooses the next job to run and returns it. Marks that job as in-progress.
	 * If there is no job that can be run, returns null.
	 *
	 * @returns The next job to run.
	 */
	public popNextJob(): Job | null {
		const nextJob = this.sourcesHeap.pop()

		if (nextJob) {
			this.inProgress.add(nextJob)
		}

		return nextJob || null
	}

	/**
	 * Marks a job as completed.
	 * JobOrderer will update the dependency graph and then forget about this job.
	 *
	 * @param completedJob - The job that is completed.
	 */
	public reportCompletedJob(completedJob: Job): void {
		const dependents = this.jobToDependents.get(completedJob)

		if (!dependents) {
			throw new Error(
				`We don't know about this job marked completed: ${completedJob}.`,
			)
		}

		for (const dependent of dependents) {
			dependent.incompletePrerequisites.delete(completedJob)
			if (dependent.isSource()) {
				this.sourcesHeap.push(dependent)
				this.nonSources.delete(dependent)
			}
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
		if (!this.inProgress.has(failedJob)) {
			throw new Error(`We don't know about the job ${failedJob}.`)
		}

		this.inProgress.delete(failedJob)
		assert(failedJob.isSource())
		this.sourcesHeap.push(failedJob)
	}

	/**
	 * @returns Whether all of the jobs are complete.
	 */
	public isDone(): boolean {
		return !(
			this.sourcesHeap.length ||
			this.nonSources.size ||
			this.inProgress.size
		)
	}
}
