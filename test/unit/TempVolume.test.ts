describe('safeResolve', () => {
	it.todo('correctly resolves safe paths')
	it.todo('rejects relative paths that escape the root')
	it.todo('rejects absolute paths that escape the root')
	it.todo('rejects paths will null bytes')
	it.todo('rejects NTFS special paths')
})

describe('createTempDir', () => {
	it.todo('creates a tempdir within the system temp directory')
	it.todo('ensures the tempdir can be written to')
	it.todo('ensures the tempdir cannot be accessed by others')
})

describe('destroyTempDir', () => {
	it.todo('removes the tempdir and its contents')
	it.todo('reports failure if the directory cannot be removed')
})

describe('withTempDir', () => {
	it.todo('creates the tempdir before the action is triggered')
	it.todo('removes the tempdir after the action completes')
	it.todo('removes the tempdir even when the action throws')
	it.todo('propagates the promise status of the action')
})
