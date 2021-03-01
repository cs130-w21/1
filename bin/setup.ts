#!/usr/bin/env node

import { makeMusl } from '../src'

if (process.argv.length < 3) {
	throw new Error('Usage: npm run setup -- <config-file>')
}
makeMusl(process.argv[2]).catch(console.error)
