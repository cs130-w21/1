/* Imports for SSH 'server implementation */
import * as ssh2 from 'ssh2'
import * as net from 'net'
import * as fs from 'fs'
/* Variables for hostkeys */
// var crypto = require('crypto');
// var inspect = require('util').inspect;

// var ssh2 = require('ssh2');
// var utils = ssh2.utils;

export function createDaemon(): net.Server {
	// Create server object
	const server = new ssh2.Server(
		// SSH authentication information
		{ hostKeys: [fs.readFileSync('host.key')] },
		// Handle client
		(client: ssh2.Connection) => {
			// Successful connection
			console.log('Hello World! Client connected!')

			// Client authentication (Currently dummy)
			client.on('authentication', (ctx: ssh2.AuthContext) => {
				ctx.accept()
			})
			// Specify port being listened on
		},
	).listen(0, '127.0.0.1', () => {
		console.log('Listening.')
		// Work-around
		;(server as net.Server).listening = true
	})

	return server as net.Server
}
