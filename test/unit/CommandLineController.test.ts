/**
 * Tests for the Command-Line Argument Parser
 */

// When yargs encounters an invalid option, it'll automatically invoke process.exit().
// This is a problem, because it would muck up our testing framework.
// We could handle this by explicitly passing a fail() callback to yargs,
// but this would override the very-nice default handler. In short, testing
// this scenario would require a lot of code.
//
// I don't think that the effort is worth it, because our code is just a
// wrapper around yargs anyways (I trust their tests).

import * as cli from '../../src/Controller/CommandLineController'

describe('Parser', () => {
	it('interprets short options', () => {
		const argv: readonly string[] = [
			'0',
			'1',
			'2',
			'-f',
			'mf',
			'-i',
			'di',
			'-t',
			't',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('mf')
		expect(results.docker_image).toBe('di')
		expect(results.target).toBe('t')
	})

	it('interprets --option=var style long options', () => {
		const argv: readonly string[] = [
			'0',
			'1',
			'2',
			'3',
			'--makefile=mf',
			'--docker-image=di',
			'--target=t',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('mf')
		expect(results.docker_image).toBe('di')
		expect(results.target).toBe('t')
	})

	it('interprets "--option var" style long options', () => {
		const argv: readonly string[] = [
			'0',
			'1',
			'2',
			'3',
			'--makefile',
			'mf',
			'--docker-image',
			'di',
			'--target',
			't',
		]
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('mf')
		expect(results.docker_image).toBe('di')
		expect(results.target).toBe('t')
	})

	it('sets correct default options', () => {
		const argv: readonly string[] = ['0', '1']
		const results = cli.interpretArgv(argv)
		expect(results.makefile).toBe('Makefile')
		expect(results.docker_image).toBe('ubuntu:18.04')
		expect(results.target).toBeNull()
	})
})
