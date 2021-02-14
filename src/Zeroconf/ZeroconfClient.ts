import { Bonjour, Browser } from 'bonjour'

import { Client } from '../Client/Client'
import { SERVICE_TYPE } from '../Constants'

/**
 * Start supplying a Junknet client with new remote daemons discovered via Zeroconf.
 *
 * @param bonjour - a Zeroconf session
 * @param client - a Junknet client
 * @returns the underlying network discovery browser
 */
export function supplyClient(bonjour: Bonjour, client: Client): Browser {
	const browser = bonjour.find({ type: SERVICE_TYPE })
	browser.on('up', (service) => client.introduce(service.host, service.port))
	client.once('done', () => browser.stop())
	return browser
}
