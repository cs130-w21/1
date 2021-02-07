import { Job } from './Job'

export interface JobOrderer {
	popNextJob(): Job | null
	isDone(): boolean
	reportFailedJob(job: Job): void
	reportCompletedJob(job: Job): void
}
