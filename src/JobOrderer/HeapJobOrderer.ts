import { Heap } from 'heap-js'
import { strict as assert } from 'assert'
import { Job } from '../Job/Job'
import { JobOrderer } from './JobOrderer'
import { UnknownJobError } from './UnknownJobError'

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
	private readonly sources: Heap<Job> = new Heap((job1, job2) => {
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
	 * Maps each Job to the number of its completed prerequisites (how many of its prerequisite Jobs have been reported completed).
	 *
	 * If the number of a Job's prerequisites is equal to the number of its completed prerequisites, then all of its prerequisites are completed and it's ready to be run.
	 */
	private readonly jobToNumCompletedPrereqs: Map<Job, number> = new Map<
		Job,
		number
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

		// Holds the queue of Jobs we will process during the BFS.
		const queue: Job[] = Array.from(rootJobs)

		// We use this set to store source Jobs that we have already traversed in our BFS.
		// Using this set improves efficiency because checking whether a heap has an element is O(n) but checking a Set is O(1).
		// We don't need one for the non-sources because we already keep them in the set nonSources.
		const sourcesHelperSet: Set<Job> = new Set()

		// BFS traverse dependency graph, starting with root nodes (the ultimate jobs).
		while (queue.length) {
			const job = queue.pop()
			assert(job, 'Queue with nonzero length should have returned object.')

			// Don't process the same node twice.
			if (!sourcesHelperSet.has(job) && !this.nonSources.has(job)) {
				// Update job's prerequisites' 'dependents' fields.
				for (const prerequisite of job.getPrerequisiteJobsIterable()) {
					let dependents = this.jobToDependents.get(prerequisite)

					if (!dependents) {
						dependents = new Set()
						this.jobToDependents.set(prerequisite, dependents)
					}

					dependents.add(job)
					queue.push(prerequisite)
				}

				if (job.getNumPrerequisiteJobs() === 0) {
					this.sources.push(job)
					sourcesHelperSet.add(job)
				} else {
					this.nonSources.add(job)
				}

				// Initialization.
				this.jobToNumCompletedPrereqs.set(job, 0)
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
		const numCompletedPrereqs = this.jobToNumCompletedPrereqs.get(job)
		assert(
			numCompletedPrereqs !== undefined,
			`We don't know about this job: ${job.toString()}.`,
		)
		return job.getNumPrerequisiteJobs() === numCompletedPrereqs
	}

	/**
	 * Chooses the next job to run and returns it. Marks that job as in-progress.
	 * If there is no job that can be run, returns null.
	 *
	 * @returns The next job to run.
	 */
	public popNextJob(): Job | null {
		const nextJob = this.sources.pop()

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
			const dependentNumCompletedJobs = this.jobToNumCompletedPrereqs.get(
				dependent,
			)

			assert(
				dependentNumCompletedJobs !== undefined,
				`Job ${completedJob.toString()} has dependent that we didn't process, which should be impossible.`,
			)
			this.jobToNumCompletedPrereqs.set(
				dependent,
				dependentNumCompletedJobs + 1,
			)

			if (
				dependent.getNumPrerequisiteJobs() ===
				dependentNumCompletedJobs + 1
			) {
				this.sources.push(dependent)
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
		this.sources.push(failedJob)
	}

	/**
	 * @returns Whether all of the jobs are complete.
	 */
	public isDone(): boolean {
		return !(
			this.sources.length ||
			this.nonSources.size ||
			this.inProgress.size
		)
	}
}
