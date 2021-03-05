import { strict as assert } from 'assert'
import { NormalJob } from '../../src/Job/NormalJob'
import { HeapJobOrderer } from '../../src/JobOrderer/HeapJobOrderer'
import { Job } from '../../src/Job/Job'
import { UnknownJobError } from '../../src/JobOrderer/UnknownJobError'

describe('HeapJobOrderer', () => {
	it('correctly orders jobs', () => {
		// The names are unused.
		const sourceJob: Job = new NormalJob({ target: 'sourceJob', commands: [] })
		const intermediateJob1: Job = new NormalJob({
			target: 'intermediateJob1',
			commands: [],
			prerequisiteJobs: new Set([sourceJob]),
		})
		const intermediateJob2: Job = new NormalJob({
			target: 'intermediateJob2',
			commands: [],
			prerequisiteJobs: new Set([sourceJob, intermediateJob1]),
		})
		const rootJob1: Job = new NormalJob({
			target: 'rootJob1',
			commands: [],
			prerequisiteJobs: new Set([sourceJob]),
		})
		const rootJob2: Job = new NormalJob({
			target: 'rootJob2',
			commands: [],
			prerequisiteJobs: new Set([intermediateJob2]),
		})

		const rootJobs = new Set([rootJob1, rootJob2])
		const jobOrderer = new HeapJobOrderer(rootJobs)

		expect(jobOrderer.isDone()).toBe(false)

		// sourceJob is the only source.
		expect(jobOrderer.popNextJob()).toBe(sourceJob)

		// Everything else depends on sourceJob, but sourceJob is unfinished.
		expect(jobOrderer.popNextJob()).toBeNull()

		// Once sourceJob is done, the next two Jobs are intermediateJob1 and rootJob1, in either order.
		// We use toContainEqual instead of toContain because the arrays themselves will be different, although the objects it contains will be identical.
		jobOrderer.reportCompletedJob(sourceJob)
		// TODO: create custom jest matcher to test unordered equality.
		expect([
			[intermediateJob1, rootJob1],
			[rootJob1, intermediateJob1],
		]).toContainEqual([jobOrderer.popNextJob(), jobOrderer.popNextJob()])

		// Once intermediateJob1 is done, the only available Job is intermediateJob2.
		jobOrderer.reportCompletedJob(intermediateJob1)
		expect(jobOrderer.popNextJob()).toBe(intermediateJob2)
		expect(jobOrderer.popNextJob()).toBeNull()

		// Even if rootJob1 is done, we still need intermediateJob2 to finish before we can start rootJob2.
		jobOrderer.reportCompletedJob(rootJob1)
		expect(jobOrderer.popNextJob()).toBeNull()

		// Now that intermediateJob2 is finished, we can start rootJob2.
		jobOrderer.reportCompletedJob(intermediateJob2)
		expect(jobOrderer.popNextJob()).toBe(rootJob2)

		// Once rootJob2 is done, we're done with all of our Jobs.
		jobOrderer.reportCompletedJob(rootJob2)
		expect(jobOrderer.isDone()).toBe(true)
	})

	it('throws an Error when passed an unknown job', () => {
		const jobOrderer = new HeapJobOrderer(new Set())

		expect(() => {
			jobOrderer.reportFailedJob(
				new NormalJob({ target: 'test job', commands: [] }),
			)
		}).toThrow(UnknownJobError)

		expect(() => {
			jobOrderer.reportCompletedJob(
				new NormalJob({ target: 'test job', commands: [] }),
			)
		}).toThrow(UnknownJobError)
	})

	it('correctly reports whether it is done', () => {
		const jobOrderer = new HeapJobOrderer(
			new Set([new NormalJob({ target: '', commands: [] })]),
		)

		expect(jobOrderer.isDone()).toEqual(false)
		const onlyJob = jobOrderer.popNextJob()
		assert(onlyJob)
		jobOrderer.reportCompletedJob(onlyJob)
		expect(jobOrderer.isDone()).toEqual(true)
	})

	it('reschedules failed jobs', () => {
		const jobOrderer = new HeapJobOrderer(
			new Set([new NormalJob({ target: '', commands: [] })]),
		)
		const toFail = jobOrderer.popNextJob()
		assert(toFail)

		jobOrderer.reportFailedJob(toFail)
		expect(jobOrderer.popNextJob()).toBe(toFail)
	})
})
