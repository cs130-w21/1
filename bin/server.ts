#!/usr/bin/env node

import bonjour from 'bonjour'
import Dockerode from 'dockerode'
import yargs from 'yargs'

import { AddressInfo } from 'net'
import { hostname } from 'os'
import { readFileSync } from 'fs'
import { once } from 'events'

import { SERVICE_TYPE, publishServer, createDaemon, dockerRunJob } from '../src'

interface DaemonOptions {
	hostKeys: Buffer[]
	port: number
}

// Modeled after sshd(8) where possible, see https://man.openbsd.org/sshd.
const parseOptions: (argv: string[]) => DaemonOptions = (argv) =>
	yargs(argv)
		.usage('Usage: $0 [-p <num>] [-h <key>]...')
		.example('$0 -p 22', 'Pretend to be SSH.')
		.example(
			'DOCKER_HOST=tcp://[::1]:2375 $0',
			'Run with a specific Docker daemon.',
		)
		.option('hostKeys', {
			alias: 'h',
			describe: 'SSH private key file(s) to identify this server.',
			// yargs bug: requiresArg has no effect on array-valued options.
			requiresArg: true,
			nargs: 1,
			array: true,
			string: true,
			default: 'host.key',
			// TODO: more graceful failure when file can't be read.
			coerce: (files: string[]) => files.map((file) => readFileSync(file)),
		})
		.option('port', {
			alias: 'p',
			describe: 'Port number to listen on, or 0 for any open port.',
			requiresArg: true,
			// yargs bug: setting type to number represents errors as NaN.
			number: true,
			default: 0,
			// yargs bug: an option passed multiple times automatically becomes an array.
			coerce: (number: number | number[]) =>
				Array.isArray(number) ? (number.pop() as number) : number,
		})
		// yargs bug: strict by itself doesn't prevent unwanted positional arguments.
		.demandCommand(0, 0)
		.strict().argv

async function start(): Promise<void> {
	const opts = parseOptions(process.argv.slice(2))

	const runJob = dockerRunJob(new Dockerode())
	const daemon = createDaemon((request, channel) => {
		console.log(request)
		return runJob(request, channel)
	}, opts.hostKeys)

	daemon.on('error', console.error)
	daemon.on('connection', (_, ...info) => console.log(...info))
	daemon.listen(opts.port)

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
