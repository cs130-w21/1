import { Job, JobEnv } from '../../src/Job/Job'
import { NormalJob } from '../../src/Job/NormalJob'

describe('NormalJob', () => {
	it('returns the correct name', () => {
		const expectedName = 'jobName'
		const job = new NormalJob(expectedName)
		expect(job.getTarget()).toEqual(expectedName)
	})

	it('returns the correct number of prerequisites for sources', () => {
		const sourceJob = new NormalJob('')
		expect(sourceJob.getNumPrerequisites()).toEqual(0)
	})

	it('returns the correct number of prerequisites for nonsources', () => {
		const nonsourceJob = new NormalJob(
			'',
			[''],
			new Set([new NormalJob(''), new NormalJob(''), new NormalJob('')]),
		)
		expect(nonsourceJob.getNumPrerequisites()).toEqual(3)
	})

	it('is impervious to manipulation of passed objects', () => {
		const jobToDelete = new NormalJob('asd')
		const prerequisiteJobs = new Set([jobToDelete])
		const prerequisiteFiles = new Set(['file_to_delete'])
		const commands = ['command_to_delete']

		const job = new NormalJob(
			'job',
			commands,
			prerequisiteJobs,
			prerequisiteFiles,
		)

		prerequisiteJobs.delete(jobToDelete)
		expect(job.getNumPrerequisites()).toEqual(1)

		prerequisiteFiles.delete('file_to_delete')
		expect(new Set(job.getPrerequisiteFilesIterable())).toEqual(
			new Set(['file_to_delete']),
		)

		commands.pop()
		expect(job.getCommands()).toEqual(['command_to_delete'])
	})

	it('returns the correct prerequisite Jobs', () => {
		const prerequisiteJobs = new Set<Job>([
			new NormalJob('1'),
			new NormalJob('2'),
			new NormalJob('3'),
		])
		const job = new NormalJob('job', [''], prerequisiteJobs)

		expect(new Set(job.getPrerequisiteJobsIterable())).toEqual(prerequisiteJobs)
	})

	it('returns the correct prerequisite files', () => {
		const prerequisiteFiles = new Set<string>(['hello'])
		const job = new NormalJob('job', [], new Set(), prerequisiteFiles)
		expect(new Set(job.getPrerequisiteFilesIterable())).toEqual(
			prerequisiteFiles,
		)
	})

	it('returns the correct environment', () => {
		const environment: JobEnv = Object.freeze({ dockerImage: 'fake:latest' })
		const job = new NormalJob('job', [], new Set(), new Set(), environment)
		expect(job.getEnvironment()).toEqual(environment)
	})

	// This is testing deprecated behavior.
	it('defaults to an environment with a docker image', () => {
		const job = new NormalJob('job')
		expect(typeof job.getEnvironment().dockerImage).toBe('string')
	})
})
