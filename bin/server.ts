#!/usr/bin/env node

import bonjour from 'bonjour'
import Dockerode from 'dockerode'

import { AddressInfo } from 'net'
import { hostname } from 'os'
import { once } from 'events'

import { SERVICE_TYPE, publishServer, createDaemon } from '../src'

async function start(): Promise<void> {
	const zeroconf = bonjour()
	const docker = new Dockerode()

	const daemon = createDaemon(docker)
	daemon.listen()

	await once(daemon, 'listening')
	const addr = daemon.address() as AddressInfo
	console.info(addr)

	const service = await publishServer(
		zeroconf,
		SERVICE_TYPE,
		`${hostname()}'s Junknet Server #${addr.port}`,
		daemon,
	)
	console.log(service)
}

start().catch(console.error)
