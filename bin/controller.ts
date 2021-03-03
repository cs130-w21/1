#!/usr/bin/env node

import bonjour from 'bonjour'

import {
	supplyClient,
	Client,
	createHttp2Connection,
	GenericClient,
	NormalJob,
	HeapJobOrderer,
	Job,
} from '../src'

const zeroconf = bonjour()

const job3: Job = new NormalJob('third')
const job4: Job = new NormalJob('fourth')
const job2: Job = new NormalJob('second', new Set([job3]))
const job1: Job = new NormalJob('first', new Set([job4, job2]))
const job5: Job = new NormalJob('fifth', new Set([job1]))

const client: Client = new GenericClient(
	createHttp2Connection,
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
