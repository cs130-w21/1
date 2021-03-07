import { promises as fs, existsSync } from 'fs'
import { resolve } from 'path'
import {
	safeResolve,
	createTempDir,
	destroyTempDir,
} from '../../src/Daemon/TempVolume'

describe('safeResolve', () => {
	it('correctly resolves safe paths', () => {
		// test absolute path only
		const path1 = safeResolve('/usr/bin/ls', '')
		expect(path1).toEqual('/usr/bin/ls')

		// test absolute path with file
		const path2 = safeResolve('/usr/bin', 'ls')
		expect(path2).toEqual('/usr/bin/ls')
	})
	it('rejects relative paths that escape the root', () => {
		const resolved = safeResolve('../', 'ls')
		expect(resolved).toBeUndefined()
	})
	it('rejects absolute paths that escape the root', () => {
		const resolved = safeResolve('/../', 'ls')
		expect(resolved).toBeUndefined()
	})
	it('rejects paths with null bytes', () => {
		const resolved = safeResolve('/', '\0')
		expect(resolved).toBeUndefined()
	})
	it('rejects NTFS special paths', () => {
		const resolved = safeResolve('/', '<>:"\\|?*')
		expect(resolved).toBeUndefined()
	})
})

describe('createTempDir', () => {
	let tempdir: string
	it('creates a tempdir within the system temp directory', async () => {
		tempdir = await createTempDir()
		expect(existsSync(tempdir)).toBeTruthy()
	})
	it('ensures the tempdir can be written to', async () => {
		const filepath = resolve(tempdir, 'test')

		// create a file in the temporary directory
		await fs.writeFile(filepath, 'hello')

		// check if the file is there
		expect(existsSync(filepath)).toBeTruthy()
	})
	it.todo('ensures the tempdir cannot be accessed by others')
})

describe('destroyTempDir', () => {
	let tempdir: string
	it('removes the tempdir and its contents', async () => {
		// create temporary directory
		tempdir = await createTempDir()

		// create a file in the temporary directory
		const filepath = resolve(tempdir, 'test')
		await fs.writeFile(filepath, 'hello')

		await destroyTempDir(tempdir)

		expect(existsSync(filepath)).toBeFalsy()
		expect(existsSync(tempdir)).toBeFalsy()
	})
	it.todo('reports failure if the directory cannot be removed')
})

describe('withTempDir', () => {
	it.todo('creates the tempdir before the action is triggered')
	it.todo('removes the tempdir after the action completes')
	it.todo('removes the tempdir even when the action throws')
	it.todo('propagates the promise status of the action')
})
