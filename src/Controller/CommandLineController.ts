import yargs from 'yargs'

export interface JunknetArguments {
	makefile: string | undefined
	dockerImage: string
	targets: string[]
}

/**
 * Interpret a list of user-provided CLI arguments, returning the relevant ones
 * in a compact form.
 *
 * This function is rife with side effects. `yargs` prints to console and exits
 * whenever the `--help` and `--version` options are invoked. It also exits
 * when given invalid options (eg. `--doesntexist`), and reads `package.json`
 * to find the package's current version.
 *
 * This is not good; it makes testing invalid options impossible
 * (process.exit() bypasses jest entirely; all failure modes in this function
 * are untested), and breaks encapsulation.
 *
 * After a long battle, our code has conceded to this approach; we exit when
 * given invalid positional arguments.
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
		.version() // SIDE EFFECT: parses package.json for version info.
		.help().argv

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
		// SIDE EFFECT: prints to console and exits.
		console.log(
			'Not enough arguments: provide a docker image name' +
				'(eg. "ubuntu:latest")\nTry `junknet --help` for more info',
		)
		process.exit(1)
	}

	return {
		makefile: yargsArgv.f,
		dockerImage,
		targets,
	}
}
