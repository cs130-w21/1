import { basename, dirname } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { Job } from '..'
import { makefileTraceToJobTree } from './MakefileTraceToJobTree'
import { MakeTracingError } from './MakeTracingError'

/**
 * Gets a trace from a makefile by running make with the --trace and --dry-run options.
 *
 * @param filePath - the path to the Makefile
 * @returns the trace.
 */
async function getMakefileTrace(filePath: string): Promise<string> {
	const fileName = basename(filePath)
	const directoryName = dirname(filePath)

	let stdout: string
	let stderr: string
	try {
		;({ stdout, stderr } = await promisify(exec)(
			`make --trace --dry-run -f "${fileName}" --directory="${directoryName}"`,
		))
	} catch (error) {
		throw new MakeTracingError(
			`Error while generating make trace for ${filePath}:\n${error}`,
		)
	}

	if (stderr.length > 0) {
		throw new MakeTracingError(
			`Error while generating make trace for ${filePath}.\n\nStderr:\n${stderr}\n\nStdout:${stdout}`,
		)
	}

	return stdout
}

/**
 * Constructs a DAG of Jobs from a makefile.
 *
 * The makefile mustn't include phony rules.
 *
 * @param filePath - the path to the makefile.
 */
export async function makefileToJobTree(filePath: string): Promise<Set<Job>> {
	const trace = await getMakefileTrace(filePath)
	return makefileTraceToJobTree(trace)
}
