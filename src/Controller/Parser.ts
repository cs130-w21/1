import * as yargs from 'yargs'

export interface JunknetArguments {
	makefile: string
	docker_image: string
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
		makefile: {
			alias: 'f',
			type: 'string',
			default: 'Makefile',
			desc: 'The Makefile to process',
		},
		'docker-image': {
			alias: 'i',
			type: 'string',
			default: 'ubuntu:18.04',
			desc: 'The Docker Image to run',
		},
		target: {
			alias: 't',
			type: 'string',
			desc: 'The Makefile target to build',
		},
	}).argv

	return {
		makefile: yargsArgv.makefile,
		docker_image: yargsArgv['docker-image'],
	}
}
