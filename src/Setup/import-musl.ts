import { Clone } from 'nodegit'
import { promises as fs } from 'fs'
import path from 'path'
import { spawn } from 'child_process'

async function cloneMusl(): Promise<void> {
	await Clone.clone(
		'https://github.com/richfelker/musl-cross-make',
		'./musl-cross',
	)
}

export async function makeMusl(config: string): Promise<void> {
	// requires gnu make on computer
	const filename = path.resolve('musl-cross', 'config.mak')
	await fs.rm('./musl-cross', { force: true, recursive: true })
	await cloneMusl()
	if (config) {
		await fs.copyFile(config, filename)
	} else {
		throw new Error('Need config file')
	}
	process.chdir('./musl-cross')
	const command = spawn('make', ['install', './output'])
	command.stdout.on('data', (data: Buffer) => {
		process.stdout.write(data.toString())
	})
	command.stderr.on('data', (data: Buffer) => {
		process.stderr.write(data.toString())
	})
	/* await new Promise((resolve, reject) => {
		exec('make', (err, stdout, stderr) =>
			err ? reject(err) : resolve(stdout + stderr),
		)
	}) */
}
