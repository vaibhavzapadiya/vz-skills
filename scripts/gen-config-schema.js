#!/usr/bin/env node
'use strict';
/**
 * Generates plugins/vz-skills/schema/config.v1.schema.json (JSON Schema draft-07) from the SCHEMA
 * object in plugins/vz-skills/scripts/lib/config.js, so editor validation cannot drift from the
 * resolver. `--check` exits 1 if the file is stale.
 *
 * The schema describes what the resolver's per-file validation accepts (types, enums, lengths,
 * path rules, unknown keys). Cross-field rules (safety floors, PRODUCTION minimums) need the whole
 * resolution and are stated in each description instead; `vz-config.js --validate` enforces them.
 */
const fs = require('node:fs');
const path = require('node:path');
const { SCHEMA, CONFIG_VERSION } = require('../plugins/vz-skills/scripts/lib/config');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'plugins', 'vz-skills', 'schema', 'config.v1.schema.json');

// Mirror the resolver's path rules (lib/config.js validateDocument) without platform-specific path.isAbsolute.
const RELATIVE_PATH = '^(?!~)(?![A-Za-z]:)(?![\\\\/])(?!(.*[\\\\/])?\\.\\.([\\\\/]|$)).*$';
const RELATIVE_GLOB = '^(?!.*\\.\\.)(?![\\\\/])(?![A-Za-z]:[\\\\/]).*$';

function describe(spec) {
  let d = spec.description;
  if (spec.floor) {
    const f = spec.floor;
    const parts = [];
    if (f.min !== undefined) parts.push(`Safety floor: ${JSON.stringify(f.min)}; lowering it requires listing this key in safety.acknowledged_overrides`);
    if (f.production_min !== undefined) parts.push(`Profile PRODUCTION minimum: ${JSON.stringify(f.production_min)}`);
    if (parts.length) d += ` ${parts.join('. ')}.`;
  }
  return d;
}

function leaf(key, spec) {
  const node = {};
  if (spec.type === 'string') node.type = 'string';
  else if (spec.type === 'boolean') node.type = 'boolean';
  else if (spec.type === 'number') node.type = 'number';
  else if (spec.type === 'path') { node.type = 'string'; node.pattern = RELATIVE_PATH; }
  else if (spec.type === 'string[]') {
    node.type = 'array';
    node.items = { type: 'string' };
    if (key === 'safety.acknowledged_overrides') node.items.enum = Object.keys(SCHEMA).filter((k) => SCHEMA[k].floor);
    if (key === 'hooks.protected_paths') node.items.pattern = RELATIVE_GLOB;
    if (spec.maxItems) node.maxItems = spec.maxItems;
  } else throw new Error(`gen-config-schema: unsupported type ${spec.type} for ${key}`);
  if (spec.values) node.enum = spec.values;
  if (spec.maxLength) node.maxLength = spec.maxLength;
  if (key === 'version') node.const = CONFIG_VERSION;
  node.description = describe(spec);
  return node;
}

function build() {
  const root = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'VZ Skills project configuration (version 1)',
    description: 'Contents of .vz-skills/config.json (project) or ~/.vz-skills/config.json (user). Generated from scripts/lib/config.js by scripts/gen-config-schema.js; do not edit by hand. All keys are optional; unknown keys are rejected by the resolver.',
    type: 'object',
    additionalProperties: false,
    properties: {
      $schema: { type: 'string', description: 'Path or URL of this JSON Schema, for editor support. Ignored by the resolver.' },
      $comment: { type: 'string', description: 'Free-text comment. Ignored by the resolver.' },
    },
  };
  for (const [key, spec] of Object.entries(SCHEMA)) {
    const parts = key.split('.');
    let cur = root;
    for (const p of parts.slice(0, -1)) {
      if (!cur.properties[p]) cur.properties[p] = { type: 'object', additionalProperties: false, properties: {} };
      cur = cur.properties[p];
    }
    cur.properties[parts[parts.length - 1]] = leaf(key, spec);
  }
  return JSON.stringify(root, null, 2) + '\n';
}

if (require.main === module) {
  const text = build();
  const rel = path.relative(ROOT, OUT).replace(/\\/g, '/');
  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== text) { process.stderr.write(`${rel} is stale; run node scripts/gen-config-schema.js\n`); process.exit(1); }
    process.stdout.write(`${rel} is up to date\n`);
  } else {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, text);
    process.stdout.write(`wrote ${OUT}\n`);
  }
}

module.exports = { build, OUT };
