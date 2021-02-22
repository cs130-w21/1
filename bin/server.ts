#!/usr/bin/env node

import bonjour from 'bonjour'
import Dockerode from 'dockerode'
import yargs from 'yargs'

import { AddressInfo } from 'net'
import { hostname } from 'os'
import { readFileSync } from 'fs'
import { once } from 'events'

import { SERVICE_TYPE, publishServer, createDaemon, dockerRunJob } from '../src'

async function start(): Promise<void> {
	// Modeled after sshd(8) where possible, see https://man.openbsd.org/sshd.
	const { argv: opts } = yargs(process.argv.slice(2))
		.options({
			h: {
				// yargs bug: requiresArg has no effect on array-valued options.
				requiresArg: true,
				nargs: 1,
				array: true,
				string: true,
				default: 'host.key',
				// TODO: more graceful failure when file can't be read.
				coerce: (files: string[]) => files.map((file) => readFileSync(file)),
			},
			p: {
				requiresArg: true,
				number: true,
				// By default, listen on any port.
				default: 0,
				// yargs bug: an option passed multiple times automatically becomes an array.
				coerce: (number: number | number[]) =>
					Array.isArray(number) ? number.pop() : number,
			},
		})
		// yargs bug: strict by itself doesn't prevent unwanted positional arguments.
		.demandCommand(0, 0)
		.strict()

	console.log(opts)

	const runJob = dockerRunJob(new Dockerode())
	const daemon = createDaemon((request, channel) => {
		console.log(request)
		return runJob(request, channel)
	}, opts.h)

	daemon.on('error', console.error)
	daemon.on('connection', (_, ...info) => console.log(...info))
	daemon.listen(opts.p)

	await once(daemon, 'listening')
	const addr = daemon.address() as AddressInfo
	console.info(addr)

	const service = await publishServer(
		bonjour(),
		SERVICE_TYPE,
		`${hostname()}'s Junknet Server #${addr.port}`,
		daemon,
	)
	console.info(service)
}

start().catch(console.error)
