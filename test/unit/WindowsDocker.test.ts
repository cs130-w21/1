import { convertPath } from '../../src/Daemon/WindowsDocker'

describe('convertPath', () => {
	it('correctly converts and normalizes an absolute path', () => {
		const orig = 'C:\\Users\\..\\Users\\Junknet Files\\foo.txt'
		const conv = '/mnt/c/Users/Junknet Files/foo.txt'
		expect(convertPath(orig)).toBe(conv)
	})

	it('rejects relative paths', () => {
		expect(() => convertPath('foo.txt')).toThrow()
	})

	it('rejects malformed paths', () => {
		expect(() => convertPath('\\Users')).toThrow()
	})
})
