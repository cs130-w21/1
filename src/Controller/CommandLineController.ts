import yargs from 'yargs'

export interface JunknetArguments {
	makefile: string | undefined
	dockerImage: string | undefined
	targets: string[]
}

/**
 * Interpret a list of user-provided CLI arguments, returning the relevant ones
 * in a compact form.
 *
 * @param argv - A list of option arguments to parse. Be mindful that node.js
 * prepends extra arguments to process.argv; if using this function from node,
 * be sure to use `process.argv.slice(2)`.
 */
export function interpretArgv(argv: readonly string[]): JunknetArguments {
	// Use only the first two elements; Node.js appends extra elements to process.argv.
	const yargsArgv = yargs(argv)
		.usage(
			'Build a makefile target in parallel, given a docker image and' +
				'a list of targets\nUsage: ' +
				'junknet [-f makefile] docker-image [target1 target2...]',
		)
		.epilogue(
			'for more information, read our manual ' +
				'at https://github.com/cs130-w21/1',
		)
		.options({
			f: {
				alias: 'makefile',
				type: 'string',
				desc: 'The Makefile to process',
			},
		})
		.help().argv

	const positionalArguments = yargsArgv._ as string[]

	let dockerImage
	const targets: string[] = []
	for (const arg of positionalArguments) {
		if (dockerImage === undefined) {
			dockerImage = arg
		} else {
			targets.push(arg)
		}
	}

	if (dockerImage === undefined) {
		throw Error('Not enough arguments')
	}

	return {
		makefile: yargsArgv.f,
		dockerImage,
		targets,
	}
}
