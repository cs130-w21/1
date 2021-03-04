import { mkdtemp, rmdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

/**
 * Absolute path prefix for temporary directories.
 * Includes the process ID to avoid conflicting with other daemons.
 * Should be within the OS's temporary directory. Must not end in X.
 * @see https://nodejs.org/api/fs.html#fs_fspromises_mkdtemp_prefix_options
 */
const TEMP_PREFIX = join(tmpdir(), `junknet-${process.pid}-`)

/**
 * Pattern for an invalid path or one that has special behavior.
 * This excludes the null byte and all Windows special path characters.
 * @see https://nodejs.org/api/fs.html#fs_fspromises_open_path_flags_mode
 */
const INVALID_PATH = /[\0<>:"\\|?*]/

/**
 * Resolve a relative filename within a root directory.
 * This is a security-critical function. It prevents pathname traversal.
 * @param root - The directory that cannot be exited from.
 * @param file - Something that should be a relative path.
 * @returns The absolute path to the named file.
 */
export function safeResolve(root: string, file: string): string | undefined {
	if (INVALID_PATH.test(file)) {
		return undefined
	}

	const path = join(root, file)
	return path.startsWith(root) ? path : undefined
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
