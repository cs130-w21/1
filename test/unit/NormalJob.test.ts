import { Job, JobEnv } from '../../src/Job/Job'
import { NormalJob } from '../../src/Job/NormalJob'

describe('NormalJob', () => {
	const dummyEnv: JobEnv = { dockerImage: 'fake' }

	it('returns the correct name', () => {
		const expectedTarget = 'jobTarget'
		const job = new NormalJob({
			target: expectedTarget,
			commands: [],
			environment: dummyEnv,
		})
		expect(job.getTarget()).toEqual(expectedTarget)
	})

	it('returns the correct target', () => {
		const expectedName = 'jobName'
		const job = new NormalJob({
			target: expectedName,
			commands: [],
			environment: dummyEnv,
		})
		expect(job.getName()).toEqual(expectedName)
	})

	it('returns the correct number of prerequisites for sources', () => {
		const sourceJob = new NormalJob({
			target: '',
			commands: [],
			environment: dummyEnv,
		})
		expect(sourceJob.getNumPrerequisiteJobs()).toEqual(0)
	})

	it('returns the correct number of prerequisites for nonsources', () => {
		const nonsourceJob = new NormalJob({
			target: '',
			commands: [],
			prerequisiteJobs: new Set([
				new NormalJob({ target: '', commands: [], environment: dummyEnv }),
				new NormalJob({ target: '', commands: [], environment: dummyEnv }),
				new NormalJob({ target: '', commands: [], environment: dummyEnv }),
			]),
			environment: dummyEnv,
		})
		expect(nonsourceJob.getNumPrerequisiteJobs()).toEqual(3)
	})

	it('is impervious to manipulation of passed objects', () => {
		const jobToDelete = new NormalJob({
			target: 'asd',
			commands: [],
			environment: dummyEnv,
		})
		const prerequisiteJobs = new Set([jobToDelete])
		const prerequisiteFiles = new Set(['file_to_delete'])
		const commands = ['command_to_delete']
		const environment: JobEnv = { dockerImage: 'image_to_change' }

		const job = new NormalJob({
			target: 'job',
			commands,
			prerequisiteJobs,
			prerequisiteFiles,
			environment,
		})

		prerequisiteJobs.delete(jobToDelete)
		expect(job.getNumPrerequisiteJobs()).toEqual(1)

		prerequisiteFiles.delete('file_to_delete')
		expect(new Set(job.getPrerequisiteFilesIterable())).toEqual(
			new Set(['file_to_delete']),
		)

		commands.pop()
		expect(job.getCommands()).toEqual(['command_to_delete'])

		environment.dockerImage = 'new_image'
		expect(job.getEnvironment().dockerImage).toBe('image_to_change')
	})

	it('returns the correct prerequisite Jobs', () => {
		const prerequisiteJobs = new Set<Job>([
			new NormalJob({ target: '1', commands: [], environment: dummyEnv }),
			new NormalJob({ target: '2', commands: [], environment: dummyEnv }),
			new NormalJob({ target: '3', commands: [], environment: dummyEnv }),
		])
		const job = new NormalJob({
			target: 'job',
			commands: [],
			prerequisiteJobs,
			environment: dummyEnv,
		})

		expect(new Set(job.getPrerequisiteJobsIterable())).toEqual(prerequisiteJobs)
	})

	it('returns the correct prerequisite files', () => {
		const prerequisiteFiles = new Set<string>(['hello'])
		const job = new NormalJob({
			target: 'job',
			commands: [],
			prerequisiteFiles,
			environment: dummyEnv,
		})
		expect(new Set(job.getPrerequisiteFilesIterable())).toEqual(
			prerequisiteFiles,
		)
	})

	it('returns the correct environment', () => {
		const environment: JobEnv = Object.freeze({ dockerImage: 'fake:latest' })
		const job = new NormalJob({ target: 'job', commands: [], environment })
		expect(job.getEnvironment()).toEqual(environment)
	})

	it('returns a recursively generated list of prerequisites', () => {
		const environment: JobEnv = Object.freeze({ dockerImage: 'fake:latest' })
		const job1 = new NormalJob({ target: '1', commands: [], environment })
		const job2 = new NormalJob({ target: '2', commands: [], environment })
		const job3 = new NormalJob({ target: '3', commands: [], environment })
		const job4 = new NormalJob({ target: '4', commands: [], environment })
		const job5 = new NormalJob({ target: '5', commands: [], environment })
		const job6 = new NormalJob({ target: '6', commands: [], environment })
		const job7 = new NormalJob({
			target: '7',
			prerequisiteJobs: new Set<Job>([job1, job2, job3]),
			commands: [],
			environment,
		})
		const job8 = new NormalJob({
			target: '8',
			prerequisiteJobs: new Set<Job>([job4, job5, job6]),
			commands: [],
			environment,
		})
		const job9 = new NormalJob({
			target: '9',
			prerequisiteJobs: new Set<Job>([job7, job8]),
			commands: [],
			environment,
		})
		const expectedArray = [job1, job2, job3, job7, job4, job5, job6, job8]
		expect(job9.getDeepPrerequisitesIterable().sort()).toEqual(
			expectedArray.sort(),
		)
	})
	// This is testing deprecated behavior.
	it('defaults to an environment with a docker image', () => {
		const job = new NormalJob({ target: 'job', commands: [] })
		expect(typeof job.getEnvironment().dockerImage).toBe('string')
	})
})
