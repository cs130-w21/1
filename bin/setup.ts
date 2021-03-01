#!/usr/bin/env node

import { makeMusl, makeMake } from '../src'

if (process.argv.length < 3) {
	throw new Error('Usage: npm run setup -- <musl|make> [config-file]')
}
if (process.argv[2] === 'musl') {
	if (process.argv.length < 4) {
		throw new Error('Usage: npm run setup -- musl <config-file>')
	}
	makeMusl(process.argv[3]).catch(console.error)
} else if (process.argv[2] === 'make') {
	makeMake().catch(console.error)
}
