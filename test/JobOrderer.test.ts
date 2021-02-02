import { Job } from '../src/Job'
import { JobOrderer } from '../src/JobOrderer'

test('JobOrderer', () => {
	const job1: Job = { prerequisites: new Set() }
	const job2: Job = { prerequisites: new Set([job1]) }
	const job3: Job = { prerequisites: new Set([job1]) }
	const job4: Job = { prerequisites: new Set([job1, job2]) }
	const job5: Job = { prerequisites: new Set([job4]) }

	const jobs: Job[] = [job1, job2, job3, job4, job5]
	const jobOrderer = new JobOrderer(jobs)

	expect(jobOrderer.isDone()).toBe(false)

	// 1 is the only source.
	expect(jobOrderer.peekNextJob()).toBe(job1)
	expect(jobOrderer.popNextJob()).toBe(job1)

	// Everything else depends on 1.
	expect(jobOrderer.popNextJob()).toBe(null)

	jobOrderer.reportCompletedJob(job1)
	expect(jobOrderer.popNextJob()).toBe(job2)
	expect(jobOrderer.popNextJob()).toBe(job3)

	jobOrderer.reportCompletedJob(job2)
	expect(jobOrderer.popNextJob()).toBe(job4)
	expect(jobOrderer.popNextJob()).toBe(null)

	jobOrderer.reportCompletedJob(job3)
	expect(jobOrderer.popNextJob()).toBe(null)

	jobOrderer.reportCompletedJob(job4)
	expect(jobOrderer.popNextJob()).toBe(job5)

	jobOrderer.reportCompletedJob(job5)
	expect(jobOrderer.isDone()).toBe(true)
})
