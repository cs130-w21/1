/* TODO: real unit tests */
import { doDaemonStuff } from '../src/Daemon'

test('doDaemonStuff', () => {
	expect(doDaemonStuff()).toBe('daemon')
})
