/**
 * Integration test suite for the Dockerode wrappers.
 */

import {
	listImages,
	listContainers,
	importImage,
	callbackImportImage,
	createContainer,
	attachStreams,
	stopContainer,
	removeContainer,
} from '../src/DaemonExec'

test('dockerode', () => {
	expect(listImages).toBeDefined()
	expect(listContainers).toBeDefined()
	expect(importImage).toBeDefined()
	expect(callbackImportImage).toBeDefined()
	expect(createContainer).toBeDefined()
	expect(attachStreams).toBeDefined()
	expect(stopContainer).toBeDefined()
	expect(removeContainer).toBeDefined()
})
