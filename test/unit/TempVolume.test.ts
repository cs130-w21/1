import { promises as fs, existsSync } from 'fs'
import { resolve } from 'path'
import {
	safeResolve,
	createTempDir,
	destroyTempDir,
	withTempDir,
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
	it('ensures the tempdir cannot be accessed by others', async () => {
		const stat = await fs.stat(tempdir)

		// 511 is octal for 777, 448 is octal for 700
		// this is testing that the permissions are only for the user
		// see https://man7.org/linux/man-pages/man2/chmod.2.html for more details
		// eslint-disable-next-line no-bitwise
		expect(stat.mode & 511).toBe(448)
	})
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
	it('reports failure if the directory cannot be removed', async () => {
		// create temporary directory
		tempdir = await createTempDir()

		// create a file in the temporary directory
		const filepath = resolve(tempdir, 'test')
		await fs.writeFile(filepath, 'hello')

		await fs.chmod(tempdir, 0o000)

		// try to destroy the directory
		await expect(destroyTempDir(tempdir)).rejects.toThrow()
	})
})

describe('withTempDir', () => {
	it('creates the tempdir before the action is triggered', async () => {
		const action = async (root: string): Promise<boolean> => existsSync(root)
		await expect(withTempDir(action)).resolves.toBeTruthy()
	})
	it('removes the tempdir after the action completes', async () => {
		const action = async (root: string): Promise<string> => root
		const directory = await withTempDir(action)
		expect(existsSync(directory)).toBeFalsy()
	})
	it('removes the tempdir even when the action throws', async () => {
		const action = async (root: string): Promise<string> => {
			throw new Error(root)
			return root
		}

		await withTempDir(action).catch((error: Error) => {
			expect(existsSync(error.message)).toBeFalsy()
		})
	})
	it('propagates the promise status of the action', async () => {
		const resolveAction = async (root: string): Promise<string> => root

		const rejectAction = async (root: string): Promise<string> => {
			throw new Error(root)
			return root
		}

		await expect(withTempDir(resolveAction)).resolves.toBeDefined()
		await expect(withTempDir(rejectAction)).rejects.toThrow()
	})
})
