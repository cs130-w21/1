import { Job } from './Job'

export class JobOrderer {
	private sources: Set<Job> = new Set()
	private nonSources: Set<Job> = new Set()
	private inProgress: Set<Job> = new Set()
	private jobToDependents: Map<Job, Set<Job>> = new Map()

	constructor(jobs: Job[]) {
		// Initialize dependents map.
		jobs.forEach((job) => this.jobToDependents.set(job, new Set()))

		// Populate dependents map.
		jobs.forEach((job) => {
			job.prerequisites.forEach((prerequisite) => {
				const prerequisiteDependents = this.jobToDependents.get(prerequisite)

				if (prerequisiteDependents) {
					prerequisiteDependents.add(job)
				} else {
					throw `Job ${job} has prerequisite ${prerequisite} which was not passed to the constructor.`
				}
			})
		})

		// Move sources to correct set.
		jobs.forEach((job) => {
			if (job.prerequisites.size == 0) {
				this.sources.add(job)
			} else {
				this.nonSources.add(job)
			}
		})
	}

	public peekNextJob(): Job | null {
		if (this.sources.size) {
			return Array.from(this.sources.values()).reduce((job1, job2) => {
				const job1Dependents = this.jobToDependents.get(job1)
				const job2Dependents = this.jobToDependents.get(job2)

				if (!job1Dependents) {
					throw 'Job 1 is missing in the map'
				} else if (!job2Dependents) {
					throw 'Job 1 is missing in the map'
				} else {
					return job1Dependents.size > job2Dependents.size ? job1 : job2
				}
			})
		} else {
			return null
		}
	}

	public popNextJob(): Job | null {
		const nextJob = this.peekNextJob()

		if (nextJob) {
			this.sources.delete(nextJob)
			this.inProgress.add(nextJob)
		}

		return nextJob
	}

	public reportCompletedJob(completedJob: Job): void {
		const dependents = this.jobToDependents.get(completedJob)

		if (dependents) {
			dependents.forEach((dependent) => {
				dependent.prerequisites.delete(completedJob)
				if (dependent.prerequisites.size == 0) {
					this.sources.add(dependent)
					this.nonSources.delete(dependent)
				}
			})
		} else {
			throw `We don't know about this job.`
		}

		this.inProgress.delete(completedJob)
	}

	public isDone(): boolean {
		return !(this.sources.size || this.nonSources.size || this.inProgress.size)
	}
}
