import yargs from 'yargs'

/**
 * Contains processed argument data (usually from `process.argv`).
 *
 */
export interface ArgvData {
	/**
	 * Unused; right now, it's hardcoded to 'Makefile'.
	 *
	 * Its intent was to capture the makefile specified by the user (eg.
	 * `build.make`), and to be `undefined` when no Makefile was specified.
	 *
	 * We cut this functionality due to time constraints; it's preserved here
	 * for compatibility + futureproofing.
	 */
	makefile: string | undefined

	/**
	 * The Docker Image specified by the user (eg. `ubuntu:latest`).
	 */
	dockerImage: string

	/**
	 * A list of build targets specified by the user
	 * (eg. `[all, a.out, clean]`).
	 * This list is empty if no targets were specified.
	 */
	targets: string[]

	/**
	 * This flag instructs the caller of `interpretArgv` to exit cleanly.
	 * Eg. If `--help` was specified on the command line, `interpretArgv` will
	 * print a help message and set this flag.
	 */
	cleanExit: boolean

	/**
	 * This flag indicates `interpretArgv` that incorrect arguments were given
	 * to the CLI. The caller should print an error message to the console,
	 * then exit with an error code.
	 */
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
			'Build a makefile target in parallel, given a docker image and ' +
				'a list of targets\nUsage: ' +
				'junknet docker-image [target1 target2...]',
		)
		.epilogue(
			'for more information, read our manual ' +
				'at https://github.com/cs130-w21/1',
		)
		.exitProcess(false) // Don't `process.exit()` on invalid options.
		.version() // SIDE EFFECT: parses package.json for version info.
		.help().argv

	// Exit when given `--help` or `--version`.
	if (yargsArgv.help !== undefined || yargsArgv.version !== undefined) {
		return {
			makefile: 'Makefile',
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
			makefile: 'Makefile',
			dockerImage: '',
			targets: [],
			cleanExit: false,
			invalidArguments: true,
		}
	}

	return {
		makefile: 'Makefile',
		dockerImage,
		targets,
		cleanExit: false,
		invalidArguments: false,
	}
}
