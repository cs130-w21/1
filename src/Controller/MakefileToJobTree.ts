import { basename, dirname } from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { Job } from '..'
import { makefileTraceToJobTree } from './MakefileTraceToJobTree'
import { MakeTracingError } from './MakeTracingError'

/**
 * Gets a trace from a makefile by running make with the --trace and --dry-run options.
 *
 * @param options - an object containing options for running make.
 * @param filePath - the path to the makefile. If omitted, no makefile will be specified to make.
 * @param targets - the makefile targets to build. If omitted, no targets will be specified to make.
 * @returns the trace.
 */
async function getMakefileTrace(options: {
	filePath?: string
	targets?: string[]
}): Promise<string> {
	let command = 'make --trace --dry-run'

	if (options.filePath) {
		const fileName = basename(options.filePath)
		const directoryName = dirname(options.filePath)

		command += ` -f "${fileName}" --directory="${directoryName}"`
	}

	if (options.targets) {
		command += ` ${options.targets.join(' ')}`
	}

	let stdout: string
	let stderr: string
	try {
		;({ stdout, stderr } = await promisify(exec)(command))
	} catch (error) {
		throw new MakeTracingError(
			`Error while generating make trace using command "${command}":\n${error}`,
		)
	}

	if (stderr.length > 0) {
		throw new MakeTracingError(
			`Error while generating make trace using command "${command}".\n\nStderr:\n${stderr}\n\nStdout:${stdout}`,
		)
	}

	return stdout
}

/**
 * Constructs a DAG of Jobs from a makefile.
 *
 * The makefile mustn't include phony rules.
 *
 * @param options - an object containing options for running make.
 * @param filePath - the path to the makefile. If omitted, no makefile will be specified to make.
 * @param targets - the makefile targets to build. If omitted, no targets will be specified to make.
 * @returns the tree's root jobs.
 */
export async function makefileToJobTree(options: {
	filePath?: string
	targets?: string[]
}): Promise<Set<Job>> {
	const trace = await getMakefileTrace({
		filePath: options.filePath,
		targets: options.targets,
	})
	return makefileTraceToJobTree(trace)
}
