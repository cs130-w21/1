#!/usr/bin/env node

import bonjour from 'bonjour'

import {
	supplyClient,
	Client,
	createSSHConnection,
	GenericClient,
	HeapJobOrderer,
} from '../src'
import { interpretArgv } from '../src/Controller/CommandLineController'
import { makefileToJobTree } from '../src/Controller/MakefileToJobTree'

const zeroconf = bonjour()
const cliArgs = interpretArgv(process.argv.slice(2))

if (cliArgs.invalidArguments) {
	throw new Error(`Invalid arguments supplied: ${process.argv.slice(2)}.`)
}

if (cliArgs.cleanExit) {
	process.exit(0)
}

makefileToJobTree({ filePath: cliArgs.makefile, targets: cliArgs.targets })
	.then((rootJobs) => {
		const client: Client = new GenericClient(
			createSSHConnection,
			process,
			new HeapJobOrderer(rootJobs),
		)
		client.on('error', console.error)
		client.on('progress', (job, result) => console.log(job, result.status))
		client.on('done', (success): void => {
			console.log('Finished')
			process.exitCode = +!success
			zeroconf.destroy()
		})

		process.on('SIGINT', () => {
			console.log('\nClosing Daemons\n')

			client.quit()

			console.log('Exit Process\n')
		})

		const browser = supplyClient(zeroconf, client)
		browser.on('up', console.info)
		browser.on('down', console.info)

		return client
	})
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
