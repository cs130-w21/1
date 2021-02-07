#!/usr/bin/env node

import { supplyClient } from './ZeroconfClient'
import { Client } from './Client'
import { Http2Client } from './Http2Client'

import * as bonjour from 'bonjour'
import { once } from 'events'
import { NormalJob } from './NormalJob'
import { HeapJobOrderer } from './HeapJobOrderer'

const zeroconf = bonjour()

function done() {
	console.log('Finished')

	// The mDNS socket apparently has no way to tell that it's not needed.
	zeroconf.destroy()
}

const job3: NormalJob = new NormalJob('third')
const job4: NormalJob = new NormalJob('fourth')
const job2: NormalJob = new NormalJob('second', [job3])
const job1: NormalJob = new NormalJob('first', [job4, job2])
const job5: NormalJob = new NormalJob('fifth', [job1])

const client: Client = new Http2Client(
	new HeapJobOrderer([job1, job2, job3, job4, job5]),
)
client.on('progress', console.log)
once(client, 'done').then(done).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
