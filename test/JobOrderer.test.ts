import { Job } from '../src/Job'
import { JobOrderer } from '../src/JobOrderer'

/**
 * Testcase with 5 jobs.
 */
test('JobOrderer', () => {
	// The names are untouched.
	const job1: Job = { prerequisites: new Set(), name: 'yee1' }
	const job2: Job = { prerequisites: new Set([job1]), name: 'yee2' }
	const job3: Job = { prerequisites: new Set([job1]), name: 'yee' }
	const job4: Job = { prerequisites: new Set([job1, job2]), name: 'yee3' }
	const job5: Job = { prerequisites: new Set([job4]), name: 'yee4' }

	const jobs: Job[] = [job1, job2, job3, job4, job5]
	const jobOrderer = new JobOrderer(jobs)

	expect(jobOrderer.isDone()).toBe(false)

	// job1 is the only source.
	expect(jobOrderer.peekNextJob()).toBe(job1)
	expect(jobOrderer.popNextJob()).toBe(job1)

	// Everything else depends on job1, but job1 is unfinished.
	expect(jobOrderer.popNextJob()).toBeNull()

	// Once job1 is done, the next two Jobs are job2 and job3, in either order.
	// We use toContainEqual instead of toContain because the arrays themselves will be different, although the objects it contains will be identical.
	jobOrderer.reportCompletedJob(job1)
	// TODO: create custom jest matcher to test unordered equality.
	expect([
		[job2, job3],
		[job3, job2],
	]).toContainEqual([jobOrderer.popNextJob(), jobOrderer.popNextJob()])

	// Once job2 is done, the only available Job is job4.
	jobOrderer.reportCompletedJob(job2)
	expect(jobOrderer.popNextJob()).toBe(job4)
	expect(jobOrderer.popNextJob()).toBeNull()

	// Even if job3 is done, we still need job4 to finish before we can start job5.
	jobOrderer.reportCompletedJob(job3)
	expect(jobOrderer.popNextJob()).toBeNull()

	// Now that job4 is finished, we can start job5.
	jobOrderer.reportCompletedJob(job4)
	expect(jobOrderer.popNextJob()).toBe(job5)

	// Once job5 is done, we're done with all of our Jobs.
	jobOrderer.reportCompletedJob(job5)
	expect(jobOrderer.isDone()).toBe(true)
})