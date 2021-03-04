import * as t from 'io-ts'

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

export type JobRequest = t.TypeOf<typeof JobRequest>
