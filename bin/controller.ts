#!/usr/bin/env node

import bonjour from 'bonjour'

import {
	supplyClient,
	Client,
	createSSHConnection,
	GenericClient,
	NormalJob,
	HeapJobOrderer,
	Job,
} from '../src'

const zeroconf = bonjour()

const job3: Job = new NormalJob({ target: 'third', commands: [] })
const job4: Job = new NormalJob({ target: 'fourth', commands: [] })
const job2: Job = new NormalJob({
	target: 'second',
	commands: [],
	prerequisiteJobs: new Set([job3]),
})
const job1: Job = new NormalJob({
	target: 'first',
	commands: [],
	prerequisiteJobs: new Set([job4, job2]),
})
const job5: Job = new NormalJob({
	target: 'fifth',
	commands: [],
	prerequisiteJobs: new Set([job1]),
})

const client: Client = new GenericClient(
	createSSHConnection,
	process,
	new HeapJobOrderer([job5]),
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
