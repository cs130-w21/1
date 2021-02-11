import { Heap } from 'heap-js'
import { strict as assert } from 'assert'
import { Job } from './Job'
import { JobOrderer } from './JobOrderer'
import { UnknownJobError } from './UnkownJobError'

/**
 * Manages a set of jobs that have to be run.
 */
export class HeapJobOrderer implements JobOrderer {
	/**
	 * Holds all Jobs that are sources, meaning that they are runnable because they have no uncompleted prerequisistes.
	 *
	 * It's a Heap instead of a Set because we want to choose the source with the most dependents as the next Job to run.
	 * The sorting function prioritizes Jobs by the number of dependents they have.
	 */
	private readonly sourcesHeap: Heap<Job> = new Heap((job1, job2) => {
		const job1Dependents = this.jobToDependents.get(job1)
		const job2Dependents = this.jobToDependents.get(job2)

		assert(
			job1Dependents && job2Dependents,
			'Provided jobs are missing from map.',
		)

		return job2Dependents.size - job1Dependents.size
	})

	/**
	 * Holds all Jobs that aren't sources.
	 */
	private readonly nonSources: Set<Job> = new Set()

	/**
	 * Holds all source Jobs that have been requested via {@link popNextJob} but haven't yet been reported completed via {@link reportCompletedJob}.
	 */
	private readonly inProgress: Set<Job> = new Set()

	/**
	 * Maps each Job to its dependents. Used to update dependency graph.
	 *
	 * Job B's dependents include Job A if and only if Job A's prerequisites include Job B.
	 */
	private readonly jobToDependents: Map<Job, Set<Job>> = new Map<
		Job,
		Set<Job>
	>()

	/**
	 * Maps each Job to its completed prerequisites.
	 *
	 * If a Job's prerequisites is equal to its completed prerequisites, then all of its prerequisites are completed and its ready to be run.
	 */
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

				if (job.getNumPrerequisites() === 0) {
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
	 * Checks whether the given job is a source.
	 *
	 * A job is a source if all of its prerequisites are completed.
	 *
	 * @param job - The job to check.
	 * @returns Whether the given job is a source.
	 */
	private jobIsSource(job: Job): boolean {
		const completedPrereqs = this.jobToCompletedPrereqs.get(job)

		if (!completedPrereqs) {
			throw new UnknownJobError(
				`We don't know about this job: ${job.toString()}.`,
			)
		}

		return job.getNumPrerequisites() === completedPrereqs.size
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
			throw new UnknownJobError(
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
			throw new UnknownJobError(
				`We don't know about the job ${failedJob.toString()}.`,
			)
		}

		this.inProgress.delete(failedJob)
		assert(
			this.jobIsSource(failedJob),
			`Job ${failedJob.toString()} was reported failed and was in the inProgress set, but it still has unfinished prerequisites. It probably should not have been run.`,
		)
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
