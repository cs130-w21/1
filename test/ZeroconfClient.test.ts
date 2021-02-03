import { supplyClient } from '../src/ZeroconfClient'
import { Client } from '../src/Client'

import { mock, mockReset } from 'jest-mock-extended'
import { Bonjour, Browser, RemoteService } from 'bonjour'
import { EventEmitter } from 'events'

const MOCK_SERVICE_HOST = 'example.com'
const MOCK_SERVICE_PORT = 1337

describe('supplyClient', () => {
	const zeroconf = mock<Bonjour>()
	beforeEach(() => mockReset(zeroconf))

	it('introduces a service that just came up to the client', () => {
		// Arrange
		const client = mock<Client>()
		const service = mock<RemoteService>({
			host: MOCK_SERVICE_HOST,
			port: MOCK_SERVICE_PORT,
		})
		zeroconf.find.mockReturnValue(new EventEmitter() as Browser)

		// Act
		const browser = supplyClient(zeroconf, client)
		browser.emit('up', service)

		// Assert
		expect(client.introduce).toHaveBeenCalledWith(
			MOCK_SERVICE_HOST,
			MOCK_SERVICE_PORT,
		)
	})

	it('stops the browser once the client is done', () => {
		// Arrange
		const client = new EventEmitter() as Client
		zeroconf.find.mockReturnValue(mock<Browser>())

		// Act
		const browser = supplyClient(zeroconf, client)
		client.emit('done')

		// Assert
		expect(browser.stop).toHaveBeenCalled()
	})
})
