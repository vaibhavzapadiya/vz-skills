#!/usr/bin/env node
'use strict';
// Runs tests/*.test.js with node:test. The file list is expanded here because Node 18 does not glob
// `--test` arguments and cmd.exe (npm's script shell on Windows) does not expand them either.
// Extra arguments are passed through to `node --test` (for example --test-reporter=spec).
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const dir = path.join(__dirname, '..', 'tests');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.js')).sort().map((f) => path.join(dir, f));
const r = spawnSync(process.execPath, ['--test', ...process.argv.slice(2), ...files], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
