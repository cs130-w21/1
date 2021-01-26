import * as fs from 'fs'
import * as process from 'process'
import * as yargs from 'yargs'
// We need to import yargs types from the `@types/yargs`
// package. This probably wasn't done right; might cause problems later?

// Specify command-line options.
// Use only the first two elements; Node.js appends extra elements to argv.
const argv = yargs(process.argv.slice(2)).options({
	makefile: {
		alias: 'f',
		type: 'string',
		default: 'Makefile',
		desc: 'The Makefile to process',
	},
	'docker-image': {
		alias: 'i',
		type: 'string',
		default: 'ubuntu:18.04',
		desc: 'The Docker Image to run',
	},
	target: { alias: 't', type: 'string', desc: 'The Makefile target to build' },
}).argv

console.log(argv)

try {
	const data: string = fs.readFileSync(argv.makefile, 'utf8')
	console.log(data)
} catch (err) {
	console.error('Makefile not found')
	process.exit(1)
}
