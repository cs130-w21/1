/**
 * Tests for the Command-Line Argument Parser
 */

// When yargs encounters an invalid option (eg. -z), it'll automatically invoke
// process.exit(). This is a problem, because it would muck up our testing
// framework. We could handle this by explicitly passing a fail() callback to
// yargs, but this would override the very-nice default handler. In short,
// testing this scenario would require a lot of code.
//
// I don't think that the effort is worth it, because our code is just a
// wrapper around yargs anyways (I trust their tests).

import * as cli from '../../src/Controller/CommandLineController'

describe('CommandLineController', () => {
	it('interprets short options', () => {
		const argv: readonly string[] = ['-f', 'myMakefile.make', 'ubuntu:18.04']
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('myMakefile.make')
		expect(results.dockerImage).toBe('ubuntu:18.04')
	})

	it('interprets --option=var style long options', () => {
		const argv: readonly string[] = [
			'--makefile=myMakefile.make',
			'ubuntu:18.04',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('myMakefile.make')
		expect(results.dockerImage).toBe('ubuntu:18.04')
	})

	it('interprets "--option var" style long options', () => {
		const argv: readonly string[] = [
			'--makefile',
			'myMakefile.make',
			'ubuntu:18.04',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('myMakefile.make')
		expect(results.dockerImage).toBe('ubuntu:18.04')
	})

	it('interprets first positional argument as container name', () => {
		const argv: readonly string[] = ['ubuntu:latest']
		const results = cli.interpretArgv(argv)
		expect(results.dockerImage).toBe('ubuntu:latest')
	})

	it('interprets additional positional arguments as target names', () => {
		const argv: readonly string[] = ['ubuntu:latest', 'all', 'clean']
		const results = cli.interpretArgv(argv)
		expect(results.dockerImage).toBe('ubuntu:latest')
		expect(results.targets.sort()).toStrictEqual(['all', 'clean'].sort())
	})

	it('errors when given no positional arguments', () => {
		const argv: readonly string[] = []
		expect(() => {
			cli.interpretArgv(argv)
		}).toThrow(Error)
	})

	it('correctly handles missing positional arguments', () => {
		const argv: readonly string[] = ['ubuntu:18.04']
		const results = cli.interpretArgv(argv)
		expect(results.dockerImage).toBe('ubuntu:18.04')
		expect(results.targets).toEqual([])
		expect(results.makefile).toBeUndefined()
	})
})
