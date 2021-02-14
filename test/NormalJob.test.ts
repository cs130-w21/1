import { Job } from '../src/Job/Job'
import { NormalJob } from '../src/Job/NormalJob'

describe('NormalJob', () => {
	it('returns the correct name', () => {
		const expectedName = 'jobName'
		const job = new NormalJob(expectedName)
		expect(job.getName()).toEqual(expectedName)
	})

	it('returns the correct number of prerequisites for sources', () => {
		const sourceJob = new NormalJob('', new Set([]))
		expect(sourceJob.getNumPrerequisites()).toEqual(0)
	})

	it('returns the correct number of prerequisites for nonsources', () => {
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

		expect(new Set(job.getPrerequisitesIterable())).toEqual(prerequisites)
	})
})
