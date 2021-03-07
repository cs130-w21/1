import { Job, JobEnv } from '../../src/Job/Job'
import { NormalJob } from '../../src/Job/NormalJob'

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

	it('returns the correct environment', () => {
		const environment: JobEnv = Object.freeze({ dockerImage: 'fake:latest' })
		const job = new NormalJob('job', new Set(), environment)
		expect(job.getEnvironment()).toEqual(environment)
	})

	it ('returns a recursively generated list of prerequisites', () => {
		const job1 = new NormalJob('1')
		const job2 = new NormalJob('2')
		const job3 = new NormalJob('3')
		const job4 = new NormalJob('4')
		const job5 = new NormalJob('5')
		const job6 = new NormalJob('6')
		const prerequisites1 = new Set<Job>([
			job1,
			job2,
			job3,
		])
		const prerequisites2 = new Set<Job>([
			job4,
			job5,
			job6,
		])
		const job7 = new NormalJob('7', prerequisites1)
		const job8 = new NormalJob('8', prerequisites2)
		const prerequisites3 = new Set<Job>([
			job7,
			job8,
		])
		const job9 = new NormalJob('9', prerequisites3)
		const expectedArray = [job1, job2, job3, job7, job4, job5, job6, job8, job9]
		let result = job9.getDeepPrerequisitesIterable()
		expect(job9.getDeepPrerequisitesIterable()).toEqual(expectedArray)
	})
	// This is testing deprecated behavior.
	it('defaults to an environment with a docker image', () => {
		const job = new NormalJob('job')
		expect(typeof job.getEnvironment().dockerImage).toBe('string')
	})
})
