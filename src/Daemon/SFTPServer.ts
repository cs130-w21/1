// eslint-disable-next-line import/no-extraneous-dependencies
import { SFTPStream } from 'ssh2-streams'

import { FileHandle, open } from 'fs/promises'

import { safeResolve } from './TempVolume'

function fromFD(handle: number): Buffer {
	const buf = Buffer.allocUnsafe(2)
	buf.writeUInt16BE(handle)
	return buf
}

function toFD(data: Buffer): number | undefined {
	return data.length < 2 ? undefined : data.readUInt16BE()
}

export function handleSFTPSession(root: string, sftp: SFTPStream): void {
	const vfds = new Map<number, FileHandle>()
	let nextVFD = 0

	sftp.on('OPEN', (reqID, filename, flags, attrs) => {
		const path = safeResolve(root, filename)
		if (!path) {
			sftp.status(reqID, SFTPStream.STATUS_CODE.PERMISSION_DENIED)
			return
		}

		// TODO: attrs.mode seems to only make sense when (flags & O_CREAT)
		open(path, SFTPStream.flagsToString(flags), attrs.mode)
			.then((file) => {
				vfds.set(nextVFD, file)
				sftp.handle(reqID, fromFD(nextVFD))
				return nextVFD++
			})
			.catch(() => {
				// There are other reasons open() could fail, but we're ignoring that.
				sftp.status(reqID, SFTPStream.STATUS_CODE.NO_SUCH_FILE)
			})
	})

	sftp.on('CLOSE', (reqID, handle) => {
		const vfd = toFD(handle)
		if (vfd === undefined || !vfds.has(vfd)) {
			sftp.status(reqID, SFTPStream.STATUS_CODE.PERMISSION_DENIED)
			return
		}

		vfds
			.get(vfd)
			?.close()
			.then(() => {
				vfds.delete(vfd)
				sftp.status(reqID, SFTPStream.STATUS_CODE.OK)
				return undefined
			})
			.catch(() => {
				sftp.status(reqID, SFTPStream.STATUS_CODE.FAILURE)
			})
	})
}
