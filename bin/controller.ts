#!/usr/bin/env node

import bonjour from 'bonjour'

import { once } from 'events'

import {
	supplyClient,
	Client,
	Http2Client,
	NormalJob,
	HeapJobOrderer,
	Job,
} from '../src'

const zeroconf = bonjour()

function clientDone() {
	console.log('Finished')

	// The mDNS socket apparently has no way to tell that it's not needed.
	zeroconf.destroy()
}

const job3: Job = new NormalJob('third')
const job4: Job = new NormalJob('fourth')
const job2: Job = new NormalJob('second', new Set([job3]))
const job1: Job = new NormalJob('first', new Set([job4, job2]))
const job5: Job = new NormalJob('fifth', new Set([job1]))

const client: Client = new Http2Client(new HeapJobOrderer([job5]))
client.on('progress', console.log)
once(client, 'done').then(clientDone).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
