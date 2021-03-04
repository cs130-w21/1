import * as t from 'io-ts'

import { JobRequest } from './JobRequest'
import { GetArtifacts } from './GetArtifacts'

/**
 * A request from the Client to the Daemon.
 * It's a tagged union of all possible requests.
 */
export const Request = t.union([
	t.intersection([t.type({ action: t.literal('job') }), JobRequest]),
	t.intersection([t.type({ action: t.literal('get') }), GetArtifacts]),
])

export type Request = t.TypeOf<typeof Request>
