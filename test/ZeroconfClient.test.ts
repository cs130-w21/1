import { supplyClient } from '../src/ZeroconfClient'
import { Client } from '../src/Client'

import { mock } from 'jest-mock-extended'
import { Bonjour, Browser } from 'bonjour'
import { EventEmitter } from 'events'

const MOCK_SERVICE_HOST = 'example.com'
const MOCK_SERVICE_PORT = 1337

describe('supplyClient', () => {
	it('introduces a service that just came up to the client', () => {
		// Arrange
		const zeroconf = mock<Bonjour>()
		const client = mock<Client>()
		zeroconf.find.mockReturnValue(new EventEmitter() as Browser)

		// Act
		const browser = supplyClient(zeroconf, client)
		browser.emit('up', {
			host: MOCK_SERVICE_HOST,
			port: MOCK_SERVICE_PORT,
		})

		// Assert
		expect(client.introduce).toHaveBeenCalledWith(
			MOCK_SERVICE_HOST,
			MOCK_SERVICE_PORT,
		)
	})
})
