/**
 * Integration test suite for the Zeroconf wrappers.
 */

import { publishServer } from '../src/ZeroconfDaemon'
import { supplyClient } from '../src/ZeroconfClient'

test('zeroconf', () => {
	expect(publishServer).toBeDefined()
	expect(supplyClient).toBeDefined()
})
