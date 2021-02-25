import * as Git from 'nodegit'

export async function makeMusl(target: string, config?: string): Promise<void> {
	console.log(target)
	if (config) {
		console.log(config)
	}
}

export async function importMusl(): Promise<void> {
	if (process.platform !== 'linux')
		await Git.Clone.clone(
			'https://github.com/richfelker/musl-cross-make',
			'./musl-cross',
		)
	else await Git.Clone.clone('http://git.musl-libc.org/cgit/musl', './musl')
}
