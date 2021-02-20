/**
 * A request for the Daemon to run a job.
 *
 * @remarks
 * The request is not self-contained because it doesn't specify the recipe.
 * In the current protocol design, for simplicity, the entire Makefile is sent.
 */
export interface JobRequest {
	/**
	 * The Docker image this job should run on.
	 * TODO: describe the format of this string.
	 */
	image: string

	/**
	 * The Makefile target corresponding to this job.
	 */
	target: string
}

/**
 * Type guard for {@link JobRequest}.
 * @param data - Literally anything.
 * @returns Whether the argument can be safely cast to JobRequest.
 */
export function isJobRequest(data: unknown): data is JobRequest {
	return (
		data != null &&
		typeof (data as { image: unknown }).image === 'string' &&
		typeof (data as { target: unknown }).target === 'string'
	)
}

/**
 * Like {@link JSON.parse}, but indicate failure by return value.
 * @param text - The JSON to be parsed.
 * @returns The parsed object, or undefined if the syntax is invalid.
 */
function safeParseJSON(text: string): unknown {
	try {
		return JSON.parse(text)
	} catch (e: unknown) {
		return undefined
	}
}

/**
 * Parse a job request from its JSON serialization.
 * @param command - The JSON source to parse.
 * @returns The parsed job request, or undefined if the input is invalid.
 */
export function parseJobRequest(command: string): JobRequest | undefined {
	const request = safeParseJSON(command)
	return isJobRequest(request) ? request : undefined
}
