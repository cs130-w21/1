#!/usr/bin/env node

import * as bonjour from 'bonjour'
import { AddressInfo } from 'net'
import { hostname } from 'os'

import { SERVICE_TYPE, publishServer, createDaemon } from '../src'

const zeroconf = bonjour()

const daemon = createDaemon()
daemon.on('stream', (_, headers) => console.log(headers))
daemon.listen(() => {
	const addr = daemon.address() as AddressInfo
	console.info(addr)

	publishServer(
		zeroconf,
		SERVICE_TYPE,
		`${hostname()}'s Junknet Server #${addr.port}`,
		daemon,
	)
		.then(console.log)
		.catch(console.error)
})