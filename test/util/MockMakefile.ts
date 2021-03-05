import { rmdir, mkdir, writeFile, readFile } from 'fs/promises'
import { resolve } from 'path'

/**
 * A Makefile to be used for testing, with its parameters easily accessible.
 */
export class MockMakefile {
	readonly inputs: ReadonlyMap<string, string>

	constructor(
		readonly name: string,
		readonly output: string,
		inputs: Record<string, string>,
		readonly recipe: string[],
	) {
		this.inputs = new Map(Object.entries(inputs))
	}

	rule(): string {
		return `
${this.output}: ${[...this.inputs.keys()].join(' ')}
	${this.recipe.join('\n\t')}
`
	}

	async write(root: string): Promise<void> {
		await rmdir(root, { recursive: true })
		await mkdir(root, { recursive: true })
		await Promise.all(
			[
				...this.inputs.entries(),
				[this.name, this.rule()],
			].map(([file, content]) => writeFile(resolve(root, file), content)),
		)
	}

	async inspect(root: string): Promise<string> {
		const content = await readFile(resolve(root, this.output))
		return content.toString()
	}
}
