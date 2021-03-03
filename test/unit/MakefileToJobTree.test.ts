import { makefileToJobTree } from '../../src/Controller/MakefileToJobTree'
import { MakeTracingError } from '../../src/Controller/MakeTracingError'

describe('makefileToJobTree', () => {
	it('constructs a DAG of Jobs from a makefile', async () => {
		const rootJobs = await makefileToJobTree(
			'./test/supplementary files/makefile test 1/Makefile',
		)
		expect(rootJobs.size).toBe(1)
	})

	it('catches an error for nonexistent makefiles', async () => {
		await expect(makefileToJobTree('nonexistent_file')).rejects.toThrow(
			MakeTracingError,
		)
	})
})
