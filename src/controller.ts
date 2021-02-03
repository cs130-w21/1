#!/usr/bin/env node

import { supplyClient } from './ZeroconfClient'
import { Client } from './Client'
import { Http2Client } from './Http2Client'

import * as bonjour from 'bonjour'
import { once } from 'events'

const zeroconf = bonjour()

function clientDone() {
	console.log('Finished')

	// The mDNS socket apparently has no way to tell that it's not needed.
	zeroconf.destroy()
}

const client: Client = new Http2Client([
	'fifth',
	'fourth',
	'third',
	'second',
	'first',
])
client.on('progress', console.log)
once(client, 'done').then(clientDone).catch(console.error)

const browser = supplyClient(zeroconf, client)
browser.on('up', console.info)
browser.on('down', console.info)
