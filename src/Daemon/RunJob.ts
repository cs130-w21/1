import { ServerChannel } from 'ssh2'

import { JobRequest } from '../Network'

/**
 * Function interface for telling a daemon how to run jobs.
 * Follows the strategy design pattern.
 *
 * @remarks
 * If the job fails to execute, the promise will be rejected.
 * This is distinct from when the job completes successfully with a failing exit status.
 *
 * @param request - Description of the job to be run.
 * @param channel - The SSH client waiting for the response.
 * @returns Asynchronously, when the job is complete.
 */
export type RunJob = (
	request: JobRequest,
	channel: ServerChannel,
) => Promise<void>
