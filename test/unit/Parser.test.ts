/**
 * Tests for the Command-Line Argument Parser
 */

import * as Parser from '../../src/Controller/Parser'

// We can't test incorrect arguments, because yargs calls process.exit.
// That would stop the tests.

describe('Parser', () => {
	it('interprets short options', () => {
		const argv: readonly string[] = [
			'0', '1', '2', '-f', 'mf', '-i', 'di',
		]
		const results = Parser.interpret_argv(argv)
		expect(results.makefile).toBe('mf')
		expect(results.docker_image).toBe('di')
	})
})

