#!/usr/bin/env node

import { makeMusl } from '../src'

makeMusl(process.argv[1]).catch(console.error)
