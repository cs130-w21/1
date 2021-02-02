import { Job, JobWithDependents } from './Job'

export class JobOrderer {
	private sources: Set<JobWithDependents> = new Set()
	private nonSources: Set<JobWithDependents> = new Set()
	private inProgress: Set<JobWithDependents> = new Set()
	private jobToJWD: Map<Job, JobWithDependents> = new Map()
	private jwdToJob: Map<JobWithDependents, Job> = new Map()

	constructor(jobs: Job[]) {
		// Create a map from Job to the new JWD object.
		jobs.forEach((job) =>
			this.jobToJWD.set(job, {
				...job,
				dependents: new Set(),
				prerequisites: new Set(),
			}),
		)

		// Fill each JWD's prerequisites with the corresponding Job's prerequisites.
		this.jobToJWD.forEach((jobWithDependents, job) => {
			for (const prerequisite of job.prerequisites) {
				const prerequisiteWithDependents = this.jobToJWD.get(prerequisite)

				if (prerequisiteWithDependents) {
					jobWithDependents.prerequisites.add(prerequisiteWithDependents)
				} else {
					throw `Job ${job} has prerequisite ${prerequisite} which was not passed to the constructor.`
				}
			}
		})

		// Now the JWDs have their prerequisites. Add them to our nonSources.
		for (const jobWithDependents of this.jobToJWD.values()) {
			this.nonSources.add(jobWithDependents)
		}

		// Add the dependents field.
		for (const job of this.nonSources) {
			for (const prerequisite of job.prerequisites) {
				prerequisite.dependents.add(job)
			}
		}

		// Move all sources to the sources set.
		for (const job of this.nonSources) {
			if (job.prerequisites.size == 0) {
				this.nonSources.delete(job)
				this.sources.add(job)
			}
		}

		// Populate the reverse map.
		this.jobToJWD.forEach((jobWithDependents, job) =>
			this.jwdToJob.set(jobWithDependents, job),
		)
	}

	private _peekNextJob(): JobWithDependents | null {
		if (this.sources.size) {
			return Array.from(this.sources.values()).reduce((job1, job2) =>
				job1.dependents.size > job2.dependents.size ? job1 : job2,
			)
		} else {
			return null
		}
	}

	public peekNextJob(): Job | null {
		const jwd = this._peekNextJob()

		if (jwd) {
			return this.jwdToJob.get(jwd) || null
		} else {
			return null
		}
	}

	public popNextJob(): Job | null {
		const jwd = this._peekNextJob()

		if (jwd) {
			const job = this.jwdToJob.get(jwd)

			if (job) {
				this.sources.delete(jwd)
				this.inProgress.add(jwd)
				return this.jwdToJob.get(jwd) || null
			} else {
				throw 'This shouldnt happen.'
			}
		} else {
			return null
		}
	}

	public reportCompletedJob(completedJob: Job): void {
		const jwd = this.jobToJWD.get(completedJob)

		if (jwd) {
			for (const dependent of jwd.dependents) {
				dependent.prerequisites.delete(jwd)

				if (dependent.prerequisites.size == 0) {
					this.sources.add(dependent)
					this.nonSources.delete(dependent)
				}
			}

			// Delete job.
			this.inProgress.delete(jwd)
			this.jobToJWD.delete(completedJob)
			this.jwdToJob.delete(jwd)
		} else {
			throw 'We dont know about this job.'
		}
	}

	public isDone(): boolean {
		return !(this.sources.size || this.nonSources.size || this.inProgress.size)
	}
}
