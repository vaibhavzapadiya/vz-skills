#!/usr/bin/env node
'use strict';
/**
 * vz-config: resolve, validate, explain, and initialise VZ Skills configuration.
 *
 * Usage:
 *   node vz-config.js [--project <dir>] [--summary | --json | --explain | --schema | --profiles]
 *   node vz-config.js --validate <file.json>          validate one document without resolving
 *   node vz-config.js --init [FAST|BALANCED|PRODUCTION] [--project <dir>]   write .vz-skills/config.json (never overwrites)
 *   node vz-config.js --no-user                       ignore ~/.vz-skills/config.json
 *
 * Exit codes: 0 valid; 1 invalid configuration (errors printed, floors enforced); 2 usage error.
 */
const fs = require('node:fs');
const path = require('node:path');
const { resolveConfig, validateDocument, profileDiff, summaryText, templateFor, SCHEMA, PROFILES } = require('./lib/config');

function main() {
  const argv = process.argv.slice(2);
  const o = { project: process.cwd(), mode: 'summary', noUser: false, validate: null, init: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') o.project = argv[++i];
    else if (['--summary', '--json', '--explain', '--schema', '--profiles'].includes(a)) o.mode = a.slice(2);
    else if (a === '--no-user') o.noUser = true;
    else if (a === '--validate') o.validate = argv[++i];
    else if (a === '--init') { o.init = PROFILES.includes(argv[i + 1]) ? argv[++i] : 'BALANCED'; }
    else if (a === '-h' || a === '--help') { process.stdout.write(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 12).join('\n').replace(/^ \* ?/gm, '') + '\n'); return 0; }
    else { process.stderr.write(`vz-config: unknown argument ${a}\n`); return 2; }
  }
  if (!o.project) { process.stderr.write('vz-config: --project needs a directory\n'); return 2; }

  if (o.mode === 'schema') {
    const rows = Object.entries(SCHEMA).map(([k, s]) => ({ key: k, type: s.type, values: s.values, floor: s.floor ? { min: s.floor.min, production_min: s.floor.production_min } : undefined, description: s.description }));
    process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
    return 0;
  }
  if (o.mode === 'profiles') {
    const rows = profileDiff();
    const w = Math.max(...rows.map((r) => r.key.length));
    process.stdout.write(`${'key'.padEnd(w)}  FAST            BALANCED        PRODUCTION\n`);
    for (const r of rows) process.stdout.write(`${r.key.padEnd(w)}  ${String(r.FAST).padEnd(15)} ${String(r.BALANCED).padEnd(15)} ${String(r.PRODUCTION)}\n`);
    return 0;
  }
  if (o.validate) {
    let doc;
    try { doc = JSON.parse(fs.readFileSync(o.validate, 'utf8').replace(/^﻿/, '')); } catch (e) { process.stdout.write(`ERROR: ${o.validate} is not valid JSON: ${e.message}\n`); return 1; }
    const v = validateDocument(doc, { source: o.validate, projectRoot: path.resolve(o.project) });
    for (const e of v.errors) process.stdout.write(`ERROR: ${e.message}\n`);
    for (const w of v.warnings) process.stdout.write(`WARNING: ${w.message}\n`);
    process.stdout.write(v.errors.length ? `Invalid: ${v.errors.length} error(s)\n` : 'Valid\n');
    return v.errors.length ? 1 : 0;
  }
  if (o.init) {
    const dir = path.join(path.resolve(o.project), '.vz-skills');
    const file = path.join(dir, 'config.json');
    if (fs.existsSync(file)) { process.stdout.write(`exists: ${file} (not overwritten). Edit it directly or delete it first.\n`); return 0; }
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(templateFor(o.init, { configDir: dir }), null, 2) + '\n');
    process.stdout.write(`created: ${file} with profile ${o.init}\n`);
    return 0;
  }
  const res = resolveConfig({ projectRoot: o.project, userConfigPath: o.noUser ? null : undefined });
  if (o.mode === 'json') process.stdout.write(JSON.stringify({ ok: res.ok, profile: res.profile, effective: res.effective, sources: res.sources, layers: res.layers, errors: res.errors, warnings: res.warnings }, null, 2) + '\n');
  else if (o.mode === 'explain') {
    process.stdout.write(`project: ${res.projectRoot}\nlayers: ${res.layers.map((l) => `${l.name}=${l.present ? `present (${l.keys.length} keys)` : 'absent'}`).join(', ')}\n\n`);
    const keys = Object.keys(res.sources).sort();
    const w = Math.max(...keys.map((k) => k.length));
    for (const k of keys) process.stdout.write(`${k.padEnd(w)}  ${JSON.stringify(k.split('.').reduce((a, b) => (a ? a[b] : undefined), res.effective))}  <- ${res.sources[k]}\n`);
    process.stdout.write('\n' + summaryText(res) + '\n');
  } else process.stdout.write(summaryText(res) + '\n');
  return res.ok ? 0 : 1;
}

if (require.main === module) process.exit(main());
