export class MakeTracingError extends Error {
	constructor(
		message?: string,
		private stderr?: string,
		private stdout?: string,
	) {
		super(message)
	}
}
