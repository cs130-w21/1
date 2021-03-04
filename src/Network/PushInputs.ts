import * as t from 'io-ts'

/**
 * Indicates that the client wants to push files to the server.
 * These files are prerequisites for jobs that will be requested.
 */
export const PushInputs = t.type({})

export type PushInputs = t.TypeOf<typeof PushInputs>
