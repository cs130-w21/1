#!/usr/bin/env node

import * as bonjour from 'bonjour'
import { AddressInfo } from 'net'
import { hostname } from 'os'

import { publishServer } from '../Zeroconf/ZeroconfDaemon'
import { createDaemon } from '../Daemon/Daemon'
import { SERVICE_TYPE } from '../Constants'

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
