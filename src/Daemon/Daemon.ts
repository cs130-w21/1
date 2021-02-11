/* Imports for SSH 'server implementation */
import * as ssh2 from 'ssh2' 
import * as net from 'net'
/* Variables for hostkeys */
var fs = require('fs');
//var crypto = require('crypto');
//var inspect = require('util').inspect;

//var ssh2 = require('ssh2');
//var utils = ssh2.utils;

export function createDaemon(): net.Server {

	// Create server object
	const server = new ssh2.Server(
		// SSH authentication information 	 
		{hostKeys: [fs.readFileSync('host.key')]},
		// Handle client
		function(client : any) { 
			// Successful connection
			console.log("Hello World! Client connected!");

			//Client authentication (Currently dummy)
			client.on('authentication', function(ctx : any) {ctx.accept()});
		//Specify port being listened on
		}).listen(0, '127.0.0.1', function() {
  		console.log('Listening.');
  		// Work-around
  		(server as net.Server).listening = true;
	});
	
	return server as net.Server;
}
