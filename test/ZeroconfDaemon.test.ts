import { publishServer } from '../src/ZeroconfDaemon'
import { SERVICE_TYPE } from '../src/Constants'

import { mock } from 'jest-mock-extended'
import { Bonjour, Service } from 'bonjour'
import { AddressInfo, Server } from 'net'
import { EventEmitter } from 'events'

const MOCK_SERVICE_NAME = 'Junknet Unit Test'

const MOCK_SERVER_HOST = '127.0.0.1'
const MOCK_SERVER_PORT = 1337

describe('publishServer', () => {
	// TODO: instead of faking address(), create a real NodeJS server for mocking

	it('publishes the right service type and name', async () => {
		// Arrange
		const zeroconf = mock<Bonjour>()
		zeroconf.publish.mockImplementation((options) => {
			const service = Object.assign(new EventEmitter(), mock<Service>(options))
			setImmediate(() => service.emit('up'))
			return service
		})

		const server = mock<Server>()
		server.address.mockReturnValue(mock<AddressInfo>())

		// Act
		const service = await publishServer(
			zeroconf,
			SERVICE_TYPE,
			MOCK_SERVICE_NAME,
			server,
		)

		// Assert
		expect(service.type).toBe(SERVICE_TYPE)
		expect(service.name).toBe(MOCK_SERVICE_NAME)
	})

	it('publishes the right socket address', async () => {
		// Arrange
		const zeroconf = mock<Bonjour>()
		zeroconf.publish.mockImplementation((options) => {
			const service = Object.assign(new EventEmitter(), mock<Service>(options))
			setImmediate(() => service.emit('up'))
			return service
		})

		const server = mock<Server>()
		const address = mock<AddressInfo>({
			address: MOCK_SERVER_HOST,
			port: MOCK_SERVER_PORT,
		})
		server.address.mockReturnValue(address)

		// Act
		const service = await publishServer(
			zeroconf,
			SERVICE_TYPE,
			MOCK_SERVICE_NAME,
			server,
		)

		// Assert
		expect(service.host).toBe(MOCK_SERVER_HOST)
		expect(service.port).toBe(MOCK_SERVER_PORT)
	})

	it.todo('waits to resolve until the service is published')
	it.todo('stops publishing when the server stops listening')
})
