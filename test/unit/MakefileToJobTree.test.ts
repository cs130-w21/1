import { makefileToJobTree } from '../../src/Controller/MakefileToJobTree'
import { MakeTracingError } from '../../src/Controller/MakeTracingError'

describe('makefileToJobTree', () => {
	it('constructs a DAG of Jobs from a makefile', async () => {
		const rootJobs = await makefileToJobTree({
			filePath: './test/fixtures/makefile_test_1/Makefile',
		})
		expect(rootJobs.size).toBe(1)
	})

	it('correctly passes targets to make', async () => {
		const rootJobs = await makefileToJobTree({
			filePath: './test/fixtures/makefile_test_1/Makefile',
			targets: ['a.o', 'ddir/d.o'],
		})
		expect(rootJobs.size).toBe(2)
	})

	it('catches an error for nonexistent makefiles', async () => {
		await expect(
			makefileToJobTree({ filePath: 'nonexistent_file' }),
		).rejects.toThrow(MakeTracingError)
	})
})
