/**
 * Tests for the Command-Line Argument Parser
 */

import * as yargs from 'yargs'
import * as cli from '../../src/Controller/CommandLineController'

describe('Parser', () => {
	// Don't exit the process on failure.
	// This would abort our tests.
	yargs.exitProcess(false)

	it('interprets short options', () => {
		const argv: readonly string[] = ['0', '1', '2', '-f', 'mf', '-i', 'di']
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('mf')
		expect(results.docker_image).toBe('di')
	})

	yargs.exitProcess(true)
})
