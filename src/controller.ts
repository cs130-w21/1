#!/usr/bin/env node

import * as bonjour from 'bonjour'
import { once } from 'events'

import { supplyClient } from './ZeroconfClient'
import { Client } from './Client'
import { Http2Client } from './Http2Client'

import { NormalJob } from './NormalJob'
import { HeapJobOrderer } from './HeapJobOrderer'
import { Job } from './Job'

const zeroconf = bonjour()

function done() {
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
once(client, 'done').then(done).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
