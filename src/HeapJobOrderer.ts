import { Heap } from 'heap-js'
import { strict as assert } from 'assert'
import { Job } from './Job'
import { JobOrderer } from './JobOrderer'

/**
 * Manages a set of jobs that have to be run.
 */
export class HeapJobOrderer implements JobOrderer {
	private sourcesHeap: Heap<Job>

	private readonly nonSources: Set<Job> = new Set()

	private readonly inProgress: Set<Job> = new Set()

	private readonly jobToDependents: Map<Job, Set<Job>> = new Map<
		Job,
		Set<Job>
	>()

	private readonly jobToCompletedPrereqs: Map<Job, Set<Job>> = new Map<
		Job,
		Set<Job>
	>()

	/**
	 * Create the JobOrderer and inform it of the jobs to manage.
	 *
	 * @throws When one of the jobs has a prerequisite that is not one of the jobs, or is itself.
	 * @param jobs - The jobs to manage. They must have correctly populated prerequisites fields.
	 */
	constructor(rootJobs: Job[]) {
		// Initialize the sources heap with its sorting function.
		this.sourcesHeap = new Heap((job1, job2) => {
			const job1Dependents = this.jobToDependents.get(job1)
			const job2Dependents = this.jobToDependents.get(job2)

			assert(
				job1Dependents && job2Dependents,
				'Provided jobs are missing from map.',
			)

			return job2Dependents.size - job1Dependents.size
		})

		// Add all of the root jobs to dependents map.
		for (const rootJob of rootJobs) {
			this.jobToDependents.set(rootJob, new Set())
		}

		const queue: Job[] = Array.from(rootJobs)
		const seenSources: Set<Job> = new Set() // We use this because checking whether a heap has an element is O(n).

		// BFS traverse dependency graph, starting with root nodes (the ultimate jobs).
		while (queue.length) {
			const job = queue.pop()
			assert(job, 'Queue with nonzero length should have returned object.')

			// Don't process the same node twice.
			if (!seenSources.has(job) && !this.nonSources.has(job)) {
				// Update job's prerequisites' 'dependents' fields.
				for (const prerequisite of job.getPrerequisitesIterable()) {
					let dependents = this.jobToDependents.get(prerequisite)

					if (!dependents) {
						dependents = new Set()
						this.jobToDependents.set(prerequisite, dependents)
					}

					dependents.add(job)
					queue.push(prerequisite)
				}

				if (job.isSource()) {
					this.sourcesHeap.push(job)
					seenSources.add(job)
				} else {
					this.nonSources.add(job)
				}

				// Initialization.
				this.jobToCompletedPrereqs.set(job, new Set())
			}
		}
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
				`We don't know about this job marked completed: ${completedJob.toString()}.`,
			)
		}

		for (const dependent of dependents) {
			const dependentCompletedJobs = this.jobToCompletedPrereqs.get(dependent)

			assert(
				dependentCompletedJobs,
				`Job ${completedJob.toString()} has dependent that we didn't process, which should be impossible.`,
			)
			dependentCompletedJobs.add(completedJob)

			if (dependent.getNumPrerequisites() === dependentCompletedJobs.size) {
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
			throw new Error(`We don't know about the job ${failedJob.toString()}.`)
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
