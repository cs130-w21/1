import { NormalJob } from '../src/NormalJob'
import { HeapJobOrderer } from '../src/HeapJobOrderer'
import { Job } from '../src/Job'

/**
 * Testcase with 5 jobs.
 */
test('HeapJobOrderer', () => {
	// The names are untouched.
	const sourceJob: Job = new NormalJob('sourceJob')
	const job2: Job = new NormalJob('yee2', new Set([sourceJob]))
	const job3: Job = new NormalJob('yee', new Set([sourceJob]))
	const job4: Job = new NormalJob('yee3', new Set([sourceJob, job2]))
	const job5: Job = new NormalJob('yee4', new Set([job4]))

	const rootJobs: Job[] = [job3, job5]
	const jobOrderer = new HeapJobOrderer(rootJobs)

	expect(jobOrderer.isDone()).toBe(false)

	// sourceJob is the only source.
	expect(jobOrderer.popNextJob()).toBe(sourceJob)

	// Everything else depends on sourceJob, but sourceJob is unfinished.
	expect(jobOrderer.popNextJob()).toBeNull()

	// Once sourceJob is done, the next two Jobs are job2 and job3, in either order.
	// We use toContainEqual instead of toContain because the arrays themselves will be different, although the objects it contains will be identical.
	jobOrderer.reportCompletedJob(sourceJob)
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
