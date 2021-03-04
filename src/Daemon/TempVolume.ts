import { mkdtemp, rmdir } from 'fs/promises'
import { join, resolve } from 'path'
import { tmpdir } from 'os'

/**
 * Pattern for an invalid path or one that has special behavior.
 * This excludes the null byte and all Windows special path characters.
 * @see https://nodejs.org/api/fs.html#fs_fspromises_open_path_flags_mode
 */
const INVALID_PATH = /[\0<>:"\\|?*]/

/**
 * Absolute path prefix for temporary directories.
 * Includes the process ID to avoid conflicting with other daemons.
 * Should be within the OS's temporary directory. Must not end in X.
 * @see https://nodejs.org/api/fs.html#fs_fspromises_mkdtemp_prefix_options
 */
const TEMP_PREFIX = join(tmpdir(), `junknet-${process.pid}-`)

/**
 * Resolve a relative filename within a root directory.
 * This is a security-critical function. It prevents pathname traversal.
 * @see https://nodejs.org/en/knowledge/file-system/security/introduction/
 * @param root - Absolute path to the directory that must not be exited.
 * @param file - Something that should be a relative path.
 * @returns The absolute path to the named file.
 */
export function safeResolve(root: string, file: string): string | undefined {
	if (INVALID_PATH.test(file)) {
		return undefined
	}

	const path = resolve(root, file)
	return path.startsWith(root) ? path : undefined
}

/**
 * Create a temporary directory.
 * Instead of this, use {@link withTempDir} whenever possible.
 * @returns Asynchronously, the absolute path to a temporary directory.
 */
export function createTempDir(): Promise<string> {
	return mkdtemp(TEMP_PREFIX)
}

/**
 * Clean up a temporary directory created with {@link createTempDir}.
 * Instead of this, use {@link withTempDir} whenever possible.
 * @param path - The path to the temporary directory.
 * @returns Asynchronously, if and when the cleanup is successful.
 */
export function destroyTempDir(path: string): Promise<void> {
	return rmdir(path, { recursive: true })
}

/**
 * Provide a temporary directory for as long as the given promise executes.
 * It safely cleans up the directory once the promise settles.
 * @param action - A function that will get the absolute path to a temporary directory.
 * @returns The same as the given promise.
 */
export async function withTempDir<R>(
	action: (root: string) => Promise<R>,
): Promise<R> {
	const root = await mkdtemp(TEMP_PREFIX)
	try {
		return await action(root)
	} finally {
		await rmdir(root, { recursive: true })
	}
}
