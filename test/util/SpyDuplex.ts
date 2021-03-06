/* eslint-disable no-underscore-dangle */

import { Duplex } from 'stream'

/**
 * Mock Readable and Writeable stream that records all activity.
 */
export class SpyDuplex extends Duplex {
	/**
	 * All chunks written to this stream, in order.
	 */
	recvChunks: Buffer[] = []

	/**
	 * Never have any data available to read.
	 * @override
	 */
	// eslint-disable-next-line class-methods-use-this
	_read(): void {}

	/**
	 * Store all chunks written to this stream as Buffers.
	 * @override
	 */
	_write(
		chunk: string | Buffer,
		encoding: BufferEncoding,
		callback: () => void,
	): void {
		const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding)
		this.recvChunks.push(buf)
		callback()
	}
}
