import yargs from 'yargs'

export interface JunknetArguments {
	makefile: string | undefined
	dockerImage: string
	targets: string[]
}

export interface ArgvData {
	// The data retrieved from the passed arguments.
	arguments: JunknetArguments

	// Whether we should cleanly exit after parsing argv.
	// (eg. `--help` or `--version` was called).
	// Takes priority over invalid arguments.
	cleanExit: boolean

	// Whether incorrect arguments were given.
	// This would usually imply exiting with an error.
	incorrectArguments: boolean
}

/**
 * Interpret a list of user-provided CLI arguments, returning the relevant ones
 * in a compact form. Does not error when given invalid options (eg. `-z`), but
 * does warn on incorrect positional arguments (eg. no docker image).
 *
 * This function is rife with side effects. `yargs` prints to console whenever
 * the `--help` and `--version` options are invoked. It also reads
 * `package.json` to find the package's current version.
 *
 * @param argv - A list of option arguments to parse. Be mindful that node.js
 * prepends extra arguments to process.argv; if using this function from node,
 * be sure to use `process.argv.slice(2)`.
 */
export function interpretArgv(argv: readonly string[]): ArgvData {
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
		.exitProcess(false) // Don't `process.exit()` on invalid options.
		.version() // SIDE EFFECT: parses package.json for version info.
		.help().argv

	// Exit when given `--help` or `--version`.
	if (yargsArgv.help !== undefined || yargsArgv.version !== undefined) {
		return {
			arguments: {
				makefile: undefined,
				dockerImage: '',
				targets: [],
			},
			cleanExit: true,
			incorrectArguments: false,
		}
	}

	const positionalArgs = yargsArgv._ as string[]

	let dockerImage
	const targets: string[] = []
	for (const arg of positionalArgs) {
		if (dockerImage === undefined) {
			dockerImage = arg
		} else {
			targets.push(arg)
		}
	}

	if (dockerImage === undefined) {
		return {
			arguments: {
				makefile: undefined,
				dockerImage: '',
				targets: [],
			},
			cleanExit: false,
			incorrectArguments: true,
		}
	}

	return {
		arguments: {
			makefile: yargsArgv.f,
			dockerImage,
			targets,
		},
		cleanExit: false,
		incorrectArguments: false,
	}
}
