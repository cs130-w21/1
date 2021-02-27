import { EventEmitter, once } from 'events'

import { JobOrderer } from './JobOrderer'
import { Job } from '../Job/Job'

export class IterableJobOrderer implements AsyncIterable<Job> {
	readonly #orderer: JobOrderer

	readonly #emitter = new EventEmitter()

	constructor(orderer: JobOrderer) {
		this.#orderer = orderer
	}

	cancel(): void {
		this.#emitter.emit('error', new Error(`Cancelled ${this.constructor.name}`))
	}

	reportCompleted(job: Job): void {
		this.#orderer.reportCompletedJob(job)
		this.#emitter.emit('update')
	}

	reportFailed(job: Job): void {
		this.#orderer.reportFailedJob(job)
		this.#emitter.emit('update')
	}

	[Symbol.asyncIterator](): AsyncIterator<Job> {
		return {
			next: async (): Promise<IteratorResult<Job>> => {
				// eslint-disable-next-line no-await-in-loop
				for (; ; await once(this.#emitter, 'update')) {
					if (this.#orderer.isDone()) {
						return { done: true, value: undefined }
					}

					const job = this.#orderer.popNextJob()
					if (job) {
						return { done: false, value: job }
					}
				}
			},
		}
	}
}
