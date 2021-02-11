/* Imports for SSH server implementation */
import { Server } from 'ssh2'	

const MAX_DELAY_MS = 2000

/**
 * Randomly generate a number between 0 and {@link MAX_DELAY_MS}.
 * @returns the generated number
 */
function mockDelayMs(): number {
	return MAX_DELAY_MS * Math.random()
}

/**
 * Dummy Junknet server, using HTTP/2 as a placeholder.
 * Echoes the requested path back to the client in uppercase as plain text.
 * Randomly delayed response to create more interesting tests.
 * @experimental
 * Plan: Convert this server to be an SSH server using the ssh2 node.js library.
 */

/*
export function createDaemon(): Server {
	const server = new ssh2.Server({})
	server.on('stream', (stream, headers) => {
		const input = headers[':path']
		if (!input) {
			// Can never happen, but let's make the type checker happy.
			return
		}

		const output = input.toUpperCase()
		setTimeout(() => {
			stream.respond({
				':status': 200,
				'content-type': 'text/plain',
			})
			stream.end(output)
		}, mockDelayMs())
	})

	return server
}
*/

/* SSH Server (Daemon) 
	The Daemon receives from the client: 
		Job identifier (unique)
    	Name of Docker image
    	Name of the Makefile target to build
    	Contents of Makefile
    	Input files needed for the target
    	Human-readable metadata
        	Name of the job
	
	It returns:
    	Job identifier (echoed)
    	Current job status
    		In progress (heartbeat)
    		Failed to execute, with cause
    		Finished with return code
 		Output files produced by the target
 		stdout and stdin
*/

/* Variables for hostkeys */
var fs = require('fs');
var crypto = require('crypto');
var inspect = require('util').inspect;
 
var ssh2 = require('ssh2');
var utils = ssh2.utils;

export function createDaemon(): Server {

	// Create server object
	const server = new ssh2.Server({
		// Host key, for SSH verification
		hostKeys: [fs.readFileSync('host.key')]
	});
	
}