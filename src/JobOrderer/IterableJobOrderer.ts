/* eslint-disable max-classes-per-file */

import { EventEmitter, once } from 'events'

import { JobOrderer } from './JobOrderer'
import { Job } from '../Job/Job'

/**
 * Thrown when someone requests cancellation of a {@link IterableJobOrderer}.
 */
export class StopJobOrdererIteration extends Error {}

/**
 * Wrap a {@link JobOrderer} in an AsyncIterable.
 * This exposes the jobs as a linear sequence that can be iterated over.
 * The sequence can be controller and interrupted, which affects all users.
 */
export class IterableJobOrderer implements AsyncIterable<Job> {
	/**
	 * The wrapped job orderer that actually sequences the jobs.
	 */
	readonly #orderer: JobOrderer

	/**
	 * An internal event hub used for notifying already-started async iterators.
	 */
	readonly #emitter = new EventEmitter()

	/**
	 * Simply wrap the given job orderer.
	 */
	constructor(orderer: JobOrderer) {
		this.#orderer = orderer
	}

	/**
	 * Cause all consumers of this iterable to quit with a {@link StopJobOrdererIteration}.
	 * TODO: Use an AbortController instead.
	 */
	cancel(): void {
		this.#emitter.emit('error', new StopJobOrdererIteration())
	}

	/**
	 * Notify all consumers that the given job has completed.
	 * @param job - The job that completed.
	 */
	reportCompleted(job: Job): void {
		this.#orderer.reportCompletedJob(job)
		this.#emitter.emit('update')
	}

	/**
	 * Notify all consumers that the given job has failed and should be re-queued.
	 * @param job - The job that failed to complete.
	 */
	reportFailed(job: Job): void {
		this.#orderer.reportFailedJob(job)
		this.#emitter.emit('update')
	}

	/**
	 * Implement an async iterator.
	 * It will be done when the job orderer is done, in which case the value will be undefined.
	 */
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
