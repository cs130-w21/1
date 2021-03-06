#!/usr/bin/env node

import bonjour from 'bonjour'
import yargs from 'yargs'

import { strict as assert } from 'assert'
import {
	supplyClient,
	Client,
	createSSHConnection,
	GenericClient,
	HeapJobOrderer,
	JobEnv,
} from '../src'
import { interpretArgv } from '../src/Controller/CommandLineController'
import { makefileToJobTree } from '../src/Controller/MakefileToJobTree'

const zeroconf = bonjour()
const cliArgs = interpretArgv(process.argv.slice(2))

if (cliArgs.cleanExit) {
	process.exit(0)
}

// Exit on invalid arguments. Do this *after* checking for a clean exit, because
// we want `--help` messages to take priority over invalid arguments.
if (cliArgs.invalidArguments) {
	console.error(
		`Invalid arguments supplied: "${process.argv.slice(2).join(' ')}".`,
	)
	yargs.showHelp()
	process.exit(1)
}

async function initializeClient(): Promise<void> {
	const rootJobs = await makefileToJobTree({
		filePath: cliArgs.makefile,
		targets: cliArgs.targets,
	})

	// Update all Jobs' environment. Need to change . . .
	const env: JobEnv = { dockerImage: cliArgs.dockerImage }
	const queue = [...rootJobs]
	while (queue.length > 0) {
		const job = queue.pop()

		assert.ok(job, 'Nonempty queue pop() returned undefined.')
		job.setEnvironment(env)
		for (const prereq of job.getPrerequisiteJobsIterable()) {
			queue.push(prereq)
		}
	}

	const client: Client = new GenericClient(
		createSSHConnection,
		process,
		new HeapJobOrderer(rootJobs),
	)
	client.on('error', console.error)
	client.on('progress', (job, result) =>
		console.log('==>', 'Finished:', job.toString(), result.status, '<==', '\n'),
	)
	client.on('done', (success): void => {
		console.log('Finished')
		process.exitCode = +!success
		zeroconf.destroy()
	})

	process.on('SIGINT', () => {
		console.log('\nClosing Daemons\n')
		try {
			client.quit()
		} catch (e: unknown) {
			// No need to show the stacktrace to the user, this is "normal".
		} finally {
			process.exit()
		}
	})

	const browser = supplyClient(zeroconf, client)
	browser.on('up', (srv) => console.info(srv, '\n'))
	browser.on('down', console.info)
}

initializeClient().catch((error) => {
	console.error(error)
	process.exitCode = 1
})
