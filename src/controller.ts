#!/usr/bin/env node

import { supplyClient } from './ZeroconfClient'
import { Client } from './Client'
import { Http2Client } from './Http2Client'

import * as bonjour from 'bonjour'
import { once } from 'events'
import { Job } from './Job'

const zeroconf = bonjour()

function done() {
	console.log('Finished')

	// The mDNS socket apparently has no way to tell that it's not needed.
	zeroconf.destroy()
}

const job3: Job = new Job('third')
const job4: Job = new Job('fourth')
const job2: Job = new Job('second', [job3])
const job1: Job = new Job('first', [job4, job2])
const job5: Job = new Job('fifth', [job1])

const client: Client = new Http2Client([job1, job2, job3, job4, job5])
client.on('progress', console.log)
once(client, 'done').then(done).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
