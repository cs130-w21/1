import * as t from 'io-ts'
import { parseJSON, toError, isLeft } from 'fp-ts/Either'

/**
 * A request for the Daemon to run a job.
 *
 * @remarks
 * The request is not self-contained because it doesn't specify the recipe.
 * In the current protocol design, for simplicity, the entire Makefile is sent.
 */
export const JobRequest = t.type({
	/**
	 * The Docker image this job should run on.
	 * TODO: describe the format of this string.
	 */
	image: t.string,

	/**
	 * The Makefile target corresponding to this job.
	 */
	target: t.string,
})

// eslint-disable-next-line @typescript-eslint/no-redeclare
export type JobRequest = t.TypeOf<typeof JobRequest>

/**
 * Parse a job request from its JSON serialization.
 * @param command - The JSON source to parse.
 * @returns The parsed job request, or undefined if the input is invalid.
 */
export function parseJobRequest(command: string): JobRequest | undefined {
	// Doing this the functional way was taking a lot more time than it does in Haskell ;)
	const parsed = parseJSON(command, toError)
	if (isLeft(parsed)) {
		return undefined
	}

	const decoded = JobRequest.decode(parsed.right)
	if (isLeft(decoded)) {
		return undefined
	}

	return decoded.right
}
