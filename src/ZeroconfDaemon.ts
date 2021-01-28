import { Bonjour, Service } from 'bonjour'
import { AddressInfo, Server } from 'net'
import { once } from 'events'
import { strict as assert } from 'assert'

/**
 * Publish a server as a Zeroconf service.
 * The advertisement will be withdrawn when the server stops accepting connections.
 *
 * @param bonjour - a Zeroconf session
 * @param type - Unix service type, e.g. http or ssh
 * @param name - human-readable name which is unique on the LAN
 * @param server - a TCP server in the listening state
 * @returns the underlying service descriptor that was announced.
 */
export async function publishServer(
	bonjour: Bonjour,
	type: string,
	name: string,
	server: Server,
): Promise<Service> {
	assert.ok(server.listening)

	const addr = server.address() as AddressInfo
	const service = bonjour.publish({
		name,
		type,
		port: addr.port,
		host: addr.address,
	})

	await once(service, 'up')
	server.once('close', service.stop)
	return service
}
