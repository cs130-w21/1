// This is just a brainstorm where I tried to be as thorough as possible.
// Some of these are more important than others; it would take too long to implement them all.
describe('Daemon', () => {
	it.todo('can be constructed')
	it.todo('can start listening')
	it.todo('ignores bogus data sent to socket')

	it.todo('rejects session requests before authentication')
	it.todo('allows "none" client authentication')

	it.todo('allows multiple concurrent sessions')
	it.todo('rejects non-exec requests')

	it.todo('allows multiple exec requests within a session')
	it.todo('ignores exec requests without a waiting client')
	it.todo('rejects invalid job requests')

	it.todo('runs the requested job')
	it.todo('reports failed job to client with details')
	it.todo('attaches streams and exit status to the job')
})
