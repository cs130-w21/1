import * as yargs from 'yargs'

export interface JunknetArguments {
	makefile: string
	docker_image: string
	target: string | null
}

/**
 * Interpret a list of arguments, returning the relevant ones in the f
 *
 * @param argv - the invoking process's command-line arguments.
 * @returns JunknetInterface object containing option values.
 */
export function interpretArgv(argv: readonly string[]): JunknetArguments {
	// Use only the first two elements; Node.js appends extra elements to process.argv.
	const yargsArgv = yargs(argv.slice(2)).options({
		f: {
			alias: 'makefile',
			type: 'string',
			default: 'Makefile',
			desc: 'The Makefile to process',
		},
		i: {
			alias: 'docker_image',
			type: 'string',
			default: 'ubuntu:18.04',
			desc: 'The Docker Image to run',
		},
		t: {
			alias: 'target',
			type: 'string',
			desc: 'The Makefile target to build',
		},
	}).argv

	let target = null
	if (yargsArgv.t !== undefined) {
		target = yargsArgv.t
	}

	return {
		makefile: yargsArgv.f,
		docker_image: yargsArgv.i,
		target,
	}
}
