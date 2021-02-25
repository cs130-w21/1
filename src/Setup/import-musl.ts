import { Clone } from 'nodegit'
import { promises as fs } from 'fs'
import path from 'path'

async function importMusl(): Promise<void> {
	await Clone.clone(
		'https://github.com/richfelker/musl-cross-make',
		'./musl-cross',
	)
}

export async function makeMusl(config: string): Promise<void> {
	const filename = path.resolve('musl-cross', 'config.mak')
	await fs.rm('./musl-cross', { force: true, recursive: true })
	await importMusl()
	if (config) {
		await fs.copyFile(config, filename)
	} else {
		throw new Error('Need config file')
	}
}
