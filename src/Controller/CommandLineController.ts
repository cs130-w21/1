import yargs from 'yargs'

export interface ArgvData {
	makefile: string | undefined
	dockerImage: string
	targets: string[]

	// If this flag is set, the caller should cleanly exit.
	// This is because `--help` or `--version` was called.
	cleanExit: boolean

	// If this flag is set, incorrect arguments were given to the CLI.
	// This would usually imply printing something to the console, then exiting
	// with an error (which we don't do in this module).
	invalidArguments: boolean
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
			makefile: undefined,
			dockerImage: '',
			targets: [],
			cleanExit: true,
			invalidArguments: false,
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

	// If we haven't specified a docker image, we should exit with the
	// invalidArguments flag.
	if (dockerImage === undefined) {
		return {
			makefile: undefined,
			dockerImage: '',
			targets: [],
			cleanExit: false,
			invalidArguments: true,
		}
	}

	return {
		makefile: yargsArgv.f,
		dockerImage,
		targets,
		cleanExit: false,
		invalidArguments: false,
	}
}
