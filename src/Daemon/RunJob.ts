import { ServerChannel } from 'ssh2'

import { JobRequest } from '../Network'

export type RunJob = (
	request: JobRequest,
	channel: ServerChannel,
) => Promise<void>
