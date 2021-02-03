import { publishServer } from '../src/ZeroconfDaemon'
import { SERVICE_TYPE } from '../src/Constants'

import { mock } from 'jest-mock-extended'
import { Bonjour, Service } from 'bonjour'
import { AddressInfo, Server } from 'net'
import { EventEmitter } from 'events'

const MOCK_SERVICE_NAME = 'Junknet Unit Test'

const MOCK_SERVER_HOST = '127.0.0.1'
const MOCK_SERVER_PORT = 1337

// Parameters are unknown because those types are not exported.
function mockEmitter<T extends EventEmitter>(
	mockImplementation?: unknown,
	opts?: unknown,
) {
	// Casting to never silences both type checker and ESLint.
	const original = mock<T>(mockImplementation as never, opts as never)
	return new Proxy(new EventEmitter(), {
		get(target, prop) {
			return Reflect.has(target, prop)
				? Reflect.get(target, prop)
				: Reflect.get(original, prop)
		},
	}) as typeof original
}

describe('publishServer', () => {
	const zeroconf = mock<Bonjour>()
	zeroconf.publish.mockImplementation((options) => {
		const service = mockEmitter<Service>(options)
		setImmediate(() => service.emit('up'))
		return service
	})

	it('publishes the right service type and name', async () => {
		// Arrange
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

	it('stops publishing when the server stops listening', async () => {
		// Arrange
		const server = mockEmitter<Server>()
		server.address.mockReturnValue(mock<AddressInfo>())

		// Act
		const service = await publishServer(
			zeroconf,
			SERVICE_TYPE,
			MOCK_SERVICE_NAME,
			server,
		)
		server.emit('close')

		// Assert
		expect(service.stop).toHaveBeenCalled()
	})
})
