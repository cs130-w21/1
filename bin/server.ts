#!/usr/bin/env node

import bonjour from 'bonjour'
import Dockerode from 'dockerode'
import yargs from 'yargs'

import { AddressInfo } from 'net'
import { hostname } from 'os'
import { readFileSync } from 'fs'
import { once } from 'events'

import { SERVICE_TYPE, publishServer, createDaemon } from '../src'

async function start(): Promise<void> {
	/**
	 * Modeled after sshd(8) where possible, see https://man.openbsd.org/sshd.
	 * A few bugs, because yargs sucks:
	 * - if the p option is passed multiple times, it makes it an array instead of a number.
	 * - the h option can be passed without an argument and it doesn't complain.
	 */
	const { argv } = yargs(process.argv.slice(2))
		.options({
			h: {
				nargs: 1,
				array: true,
				string: true,
				default: 'host.key',
				coerce: (files: string[]) => files.map((file) => readFileSync(file)),
			},
			p: {
				requiresArg: true,
				number: true,
				default: 0,
			},
		})
		.strict()

	const daemon = createDaemon(new Dockerode(), argv.h)
	daemon.listen(argv.p)

	await once(daemon, 'listening')
	const addr = daemon.address() as AddressInfo
	console.info(addr)

	const service = await publishServer(
		bonjour(),
		SERVICE_TYPE,
		`${hostname()}'s Junknet Server #${addr.port}`,
		daemon,
	)
	console.log(service)
}

start().catch(console.error)
