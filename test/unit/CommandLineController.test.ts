import * as cli from '../../src/Controller/CommandLineController'

/**
 * Tests for the Command-Line Argument Parser
 */

describe('CommandLineController', () => {
	it('interprets short options', () => {
		const argv: readonly string[] = ['-f', 'myMakefile.make', 'ubuntu:18.04']
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('myMakefile.make')
		expect(results.dockerImage).toBe('ubuntu:18.04')
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
	})

	it('interprets --option=var style long options', () => {
		const argv: readonly string[] = [
			'--makefile=myMakefile.make',
			'ubuntu:18.04',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('myMakefile.make')
		expect(results.dockerImage).toBe('ubuntu:18.04')
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
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
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
	})

	it('interprets first positional argument as container name', () => {
		const argv: readonly string[] = ['ubuntu:latest']
		const results = cli.interpretArgv(argv)
		expect(results.dockerImage).toBe('ubuntu:latest')
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
	})

	it('interprets second, third... positional arguments as target names', () => {
		const argv: readonly string[] = ['ubuntu:latest', 'all', 'clean']
		const results = cli.interpretArgv(argv)
		expect(results.dockerImage).toBe('ubuntu:latest')
		expect(results.targets.sort()).toStrictEqual(['all', 'clean'].sort())
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
	})

	it('correctly handles unspecified targets', () => {
		const argv: readonly string[] = ['ubuntu:18.04']
		const results = cli.interpretArgv(argv)
		expect(results.cleanExit).toBe(false)
		expect(results.dockerImage).toBe('ubuntu:18.04')
		expect(results.targets).toEqual([])
		expect(results.makefile).toBeUndefined()
		expect(results.invalidArguments).toBe(false)
		expect(results.cleanExit).toBe(false)
	})

	it('errors when given no positional arguments', () => {
		const argv: readonly string[] = []
		expect(cli.interpretArgv(argv).invalidArguments).toBe(true)
		expect(cli.interpretArgv(argv).cleanExit).toBe(false)
	})

	it('requests a clean exit when given `--help` option', () => {
		// Mock console.log to stop yargs from printing help info.
		const spy = jest.spyOn(console, 'log').mockImplementation()

		const argv: readonly string[] = ['--help']
		expect(cli.interpretArgv(argv).invalidArguments).toBe(false)
		expect(cli.interpretArgv(argv).cleanExit).toBe(true)

		// Restore regular console functionality.
		spy.mockRestore()
	})

	it('requests a clean exit when given `--version` option', () => {
		// Mock console.log to stop yargs from printing help info.
		const spy = jest.spyOn(console, 'log').mockImplementation()

		const argv: readonly string[] = ['--version']
		expect(cli.interpretArgv(argv).invalidArguments).toBe(false)
		expect(cli.interpretArgv(argv).cleanExit).toBe(true)

		// Restore regular console functionality.
		spy.mockRestore()
	})
})
