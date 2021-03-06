import * as t from 'io-ts'

/**
 * A request for the Daemon to send build artifacts after a job.
 */
export const GetArtifacts = t.type({
	/**
	 * The filenames of the requested build artifacts.
	 */
	files: t.array(t.string),
})

export type GetArtifacts = t.TypeOf<typeof GetArtifacts>
