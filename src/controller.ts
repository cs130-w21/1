#!/usr/bin/env node

import { supplyClient } from './ZeroconfClient'
import Client from './Client'

import * as bonjour from 'bonjour'
import { once } from 'events'
import { Job } from './Job'

const zeroconf = bonjour()

function done() {
	console.log('Finished')

	// The mDNS socket apparently has no way to tell that it's not needed.
	zeroconf.destroy()
}

const job3: Job = { name: 'third', prerequisites: new Set() }
const job4: Job = { name: 'fourth', prerequisites: new Set() }
const job2: Job = { name: 'second', prerequisites: new Set([job3]) }
const job1: Job = { name: 'first', prerequisites: new Set([job4, job2]) }
const job5: Job = { name: 'fifth', prerequisites: new Set([job1]) }

const client = new Client([job1, job2, job3, job4, job5])
client.on('progress', console.log)
once(client, 'done').then(done).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
