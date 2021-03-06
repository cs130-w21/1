import { posix, win32 } from 'path'

/**
 * Translate a local Windows path to to its WSL equivalent.
 * This assumes the default settings, where C:\\ is mapped to /mnt/c and so on.
 * @param path - A Windows absolute file path with a drive letter.
 * @returns A Unix absolute path to the same location from WSL.
 */
export function convertPath(path: string): string {
	if (!win32.isAbsolute(path)) {
		throw new TypeError(`Not an absolute path: ${path}`)
	}

	const [root, ...segs] = path.split(win32.sep)
	if (!/^[A-Z]:$/.test(root)) {
		throw new TypeError(`Invalid or missing drive letter in path: ${path}`)
	}

	const drive = root[0].toLowerCase()
	return posix.join('/mnt', drive, ...segs)
}
