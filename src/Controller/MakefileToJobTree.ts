import { exec } from 'child_process'
import { promisify } from 'util'
import { Job } from '..'
import { makefileTraceToJobTree } from './MakefileTraceToJobTree'

async function getMakefileTrace(filePath: string): Promise<string> {
	const { stdout, stderr } = await promisify(exec)(
		`make --trace --dry-run -f ${filePath} --directory=../makefile-tests/`,
	)

	if (stderr.length > 0) {
		throw new Error(
			`Error while generating make trace for ${filePath}:\n${stderr}`,
		)
	}

	return stdout
}

export async function makefileToJobTree(filePath: string): Promise<Set<Job>> {
	const trace = await getMakefileTrace(filePath)
	return makefileTraceToJobTree(trace)
}
