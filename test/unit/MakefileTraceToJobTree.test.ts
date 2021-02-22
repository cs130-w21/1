import { Job } from '../../src/Job/Job'
import { makefileTraceToJobTree } from '../../src/MakefileTraceToJobTree'

describe('Deserializer', () => {
	it('correctly constructs DAG #1', () => {
		const sample = `<builtin>: update target 'funct.o' due to: funct.c
cc -c -o funct.o funct.c
<builtin>: update target 'main.o' due to: main.c
cc -c -o main.o main.c
Makefile:3: update target 'execute' due to: funct.o main.o
cc execute funct.o main.o
echo Done`
		const rootJobs = makefileTraceToJobTree(sample)
		expect(rootJobs.size).toEqual(1)

		const rootJob = rootJobs.values().next().value as Job
		expect(rootJob.getTarget()).toEqual('execute')
		expect(rootJob.getCommands()).toHaveLength(2)
		expect(rootJob.getNumPrerequisites()).toEqual(2)
	})

	it('correctly constructs DAG #2', () => {
		const sample = `Makefile:15: target 'build/vader' does not exist
git clone --depth 1 https://github.com/junegunn/vader.vim.git build/vader
Makefile:18: target 'build' does not exist
mkdir -p build
Makefile:2: update target 'test' due to: build/vader
Nu test/vimrc -c 'Vader! test/**'`
		const rootJobs = makefileTraceToJobTree(sample)
		expect(rootJobs.size).toEqual(2)
	})

	it('correctly constructs DAG #3', () => {
		const sample = `Makefile:24: update target 'build/./src/a.c.o' due to: src/a.c
mkdir -p build/./src/
cc -I./src -MMD -MP  -c src/a.c -o build/./src/a.c.o
Makefile:24: update target 'build/./src/b.c.o' due to: src/b.c
mkdir -p build/./src/
cc -I./src -MMD -MP  -c src/b.c -o build/./src/b.c.o
Makefile:24: update target 'build/./src/f.c.o' due to: src/f.c
mkdir -p build/./src/
cc -I./src -MMD -MP  -c src/f.c -o build/./src/f.c.o
Makefile:16: update target 'build/a.out' due to: build/./src/a.c.o build/./src/b.c.o build/./src/f.c.o
cc ./build/./src/a.c.o ./build/./src/b.c.o ./build/./src/f.c.o -o build/a.out `
		const rootJobs = makefileTraceToJobTree(sample)
		expect(rootJobs.size).toEqual(1)

		const rootJob = rootJobs.values().next().value as Job
		expect(rootJob.getTarget()).toEqual('build/a.out')
		expect(rootJob.getCommands()).toHaveLength(1)
		expect(rootJob.getNumPrerequisites()).toEqual(3)
	})
})
