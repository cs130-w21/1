import { Job } from '../src/Job'
import { NormalJob } from '../src/NormalJob'

describe('NormalJob', () => {
	it('returns the correct name', () => {
		const job = new NormalJob('jobName')
		expect(job.getName()).toEqual('jobName')
	})

	it('returns the correct number of prerequisites', () => {
		const sourceJob = new NormalJob('', new Set([]))
		expect(sourceJob.getNumPrerequisites()).toEqual(0)

		const nonsourceJob = new NormalJob(
			'',
			new Set([new NormalJob(''), new NormalJob(''), new NormalJob('')]),
		)
		expect(nonsourceJob.getNumPrerequisites()).toEqual(3)
	})

	it("doesn't allow direct member access", () => {
		const toDelete = new NormalJob('asd')
		const prerequisites = new Set([toDelete])

		const job = new NormalJob('job', prerequisites)
		prerequisites.delete(toDelete)
		expect(job.getNumPrerequisites()).toEqual(1)
	})

	it('returns the correct prerequisites', () => {
		const prerequisites = new Set<Job>([
			new NormalJob('1'),
			new NormalJob('2'),
			new NormalJob('3'),
		])

		const job = new NormalJob('job', prerequisites)

		for (const prerequisite of job.getPrerequisitesIterable()) {
			prerequisites.delete(prerequisite)
		}

		expect(prerequisites.size).toEqual(0)
	})
})
