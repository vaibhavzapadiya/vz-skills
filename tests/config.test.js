'use strict';
// Configuration schema, precedence, profiles, floors. Requirement IDs: REQ-004, REQ-005, REQ-012 (TC-002, TC-003, TC-013).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SCRIPTS, tmpDir, rmrf, runNode } = require('./helpers');
const cfg = require(path.join(SCRIPTS, 'lib', 'config.js'));

function projectWith(doc, name = 'cfg') {
  const dir = tmpDir(name);
  if (doc !== null) {
    fs.mkdirSync(path.join(dir, '.vz-skills'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.vz-skills', 'config.json'), typeof doc === 'string' ? doc : JSON.stringify(doc, null, 2));
  }
  return dir;
}

test('defaults resolve to BALANCED with no config files at all', () => {
  const dir = projectWith(null);
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, true);
    assert.equal(r.profile, 'BALANCED');
    assert.equal(r.effective.testing.strategy, 'affected');
    assert.equal(r.effective.hooks.command_guard, 'on');
    assert.equal(r.sources.profile, 'default');
    assert.equal(r.sources['testing.strategy'], 'profile:BALANCED');
  } finally { rmrf(dir); }
});

test('profiles differ on concrete, testable fields', () => {
  const rows = cfg.profileDiff();
  const get = (k, p) => rows.find((r) => r.key === k)[p];
  assert.deepEqual([get('testing.strategy', 'FAST'), get('testing.strategy', 'BALANCED'), get('testing.strategy', 'PRODUCTION')], ['targeted', 'affected', 'full']);
  assert.deepEqual([get('planning.plan_when', 'FAST'), get('planning.plan_when', 'BALANCED'), get('planning.plan_when', 'PRODUCTION')], ['risk>=high', 'risk>=medium', 'always']);
  assert.deepEqual([get('review.depth', 'FAST'), get('review.depth', 'BALANCED'), get('review.depth', 'PRODUCTION')], ['quick', 'standard', 'thorough']);
  assert.deepEqual([get('response.final_report', 'FAST'), get('response.final_report', 'BALANCED'), get('response.final_report', 'PRODUCTION')], ['summary', 'evidence-table', 'full']);
  assert.deepEqual([get('security.review_trigger', 'FAST'), get('security.review_trigger', 'BALANCED'), get('security.review_trigger', 'PRODUCTION')], ['sensitive-paths', 'material-changes', 'always']);
  assert.deepEqual([get('testing.require_baseline', 'FAST'), get('testing.require_baseline', 'BALANCED'), get('testing.require_baseline', 'PRODUCTION')], [false, true, true]);
  // every profile preset key must exist in the schema
  for (const r of rows) assert.ok(cfg.SCHEMA[r.key], `${r.key} in schema`);
  // every profile preset value must be an allowed value
  for (const p of cfg.PROFILES) for (const [k, v] of Object.entries(cfg.flatten(cfg.PROFILE_PRESETS[p]))) if (cfg.SCHEMA[k].values) assert.ok(cfg.SCHEMA[k].values.includes(v), `${p} ${k}=${v}`);
});

test('TC-002 valid project config: explicit keys override the preset and sources are reported', () => {
  const dir = projectWith({ version: 1, profile: 'FAST', testing: { strategy: 'full' }, conventions: { notes: 'Use 2-space indent', commit_style: 'conventional' } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.profile, 'FAST');
    assert.equal(r.effective.testing.strategy, 'full');
    assert.equal(r.sources['testing.strategy'], 'project');
    assert.equal(r.effective.review.depth, 'quick');
    assert.equal(r.sources['review.depth'], 'profile:FAST');
    assert.equal(r.effective.conventions.commit_style, 'conventional');
  } finally { rmrf(dir); }
});

test('precedence: user < project < env (profile only)', () => {
  const dir = projectWith({ version: 1, profile: 'FAST', review: { depth: 'standard' } });
  const userFile = path.join(dir, 'user.json');
  fs.writeFileSync(userFile, JSON.stringify({ version: 1, profile: 'PRODUCTION', review: { depth: 'thorough' }, response: { style: 'detailed' } }));
  try {
    let r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: userFile, env: {} });
    assert.equal(r.profile, 'FAST', 'project profile beats user profile');
    assert.equal(r.effective.review.depth, 'standard', 'project key beats user key');
    assert.equal(r.effective.response.style, 'detailed', 'user explicit key beats project preset');
    assert.equal(r.sources['response.style'], 'user');
    r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: userFile, env: { VZ_SKILLS_PROFILE: 'BALANCED' } });
    assert.equal(r.profile, 'BALANCED');
    assert.equal(r.sources.profile, 'env:VZ_SKILLS_PROFILE');
    r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: userFile, env: { VZ_SKILLS_PROFILE: 'turbo' } });
    assert.equal(r.ok, false);
    assert.match(r.errors[0].message, /VZ_SKILLS_PROFILE="turbo"/);
  } finally { rmrf(dir); }
});

test('TC-003 malformed JSON is an error with an actionable message, not a silent fallback', () => {
  const dir = projectWith('{ "profile": "FAST", ');
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    assert.match(r.errors[0].message, /not valid JSON/);
    assert.match(r.errors[0].message, /does not fall back to defaults silently/);
    const cli = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--project', dir, '--no-user']);
    assert.equal(cli.status, 1);
    assert.match(cli.stdout, /ERROR: .*not valid JSON/);
  } finally { rmrf(dir); }
});

test('unknown keys and typos are rejected with suggestions; wrong types and values name the allowed set', () => {
  const dir = projectWith({ version: 1, profil: 'FAST', testing: { stratgy: 'full', require_baseline: 'yes' }, review: { depth: 'Thorough' } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    const msgs = r.errors.map((e) => e.message).join('\n');
    assert.match(msgs, /unknown key "profil" \(did you mean "profile"\?\)/);
    assert.match(msgs, /unknown key "testing.stratgy" \(did you mean "testing.strategy"\?\)/);
    assert.match(msgs, /"testing.require_baseline" must be true or false/);
    assert.match(msgs, /"review.depth" = "Thorough" is not allowed; use one of "quick", "standard", "thorough" \(case matters: did you mean "thorough"\?\)/);
    // the typo'd profile did not change the effective profile, and rejected values are not applied
    assert.equal(r.profile, 'BALANCED');
    assert.equal(r.effective.review.depth, 'standard', 'invalid value must not leak into the effective config');
    assert.equal(r.effective.testing.require_baseline, true);
  } finally { rmrf(dir); }
});

test('safety floors: turning off a guard without acknowledgment is an error and the floor is enforced', () => {
  const dir = projectWith({ version: 1, hooks: { command_guard: 'off' }, verification: { require_evidence_labels: false } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    assert.equal(r.effective.hooks.command_guard, 'on', 'floor enforced');
    assert.equal(r.effective.verification.require_evidence_labels, true);
    assert.match(r.errors.map((e) => e.message).join('\n'), /below the safety floor "on".*safety\.acknowledged_overrides/);
  } finally { rmrf(dir); }
});

test('safety floors: an override acknowledged in the user config is applied but loudly warned every time', () => {
  const dir = projectWith({ version: 1, hooks: { command_guard: 'off' } });
  const userFile = path.join(dir, 'user-config.json');
  fs.writeFileSync(userFile, JSON.stringify({ version: 1, safety: { acknowledged_overrides: ['hooks.command_guard'] } }));
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: userFile, env: {} });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.effective.hooks.command_guard, 'off');
    assert.ok(r.warnings.some((w) => /SAFETY DOWNGRADE acknowledged: "hooks.command_guard"/.test(w.message)));
    assert.match(cfg.summaryText(r), /WARNING: SAFETY DOWNGRADE/);
  } finally { rmrf(dir); }
});

test('acknowledgments merge across files: a project list does not erase the user acknowledgment', () => {
  const dir = projectWith({ version: 1, profile: 'PRODUCTION', hooks: { command_guard: 'off' }, testing: { strategy: 'targeted' }, safety: { acknowledged_overrides: ['testing.strategy'] } });
  const userFile = path.join(dir, 'user-config.json');
  fs.writeFileSync(userFile, JSON.stringify({ version: 1, safety: { acknowledged_overrides: ['hooks.command_guard'] } }));
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: userFile, env: {} });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.effective.hooks.command_guard, 'off', 'user acknowledgment survives the project list');
    assert.equal(r.effective.testing.strategy, 'targeted', 'project may acknowledge a PRODUCTION minimum');
    assert.ok(!r.warnings.some((w) => /does not lower any floor/.test(w.message)), 'no false stale-entry warning for a PRODUCTION minimum');
  } finally { rmrf(dir); }
});

test('safety floors: a project config cannot acknowledge its own guard away', () => {
  const dir = projectWith({ version: 1, hooks: { command_guard: 'off', write_guard: 'off' }, verification: { require_evidence_labels: false }, safety: { acknowledged_overrides: ['hooks.command_guard', 'hooks.write_guard', 'verification.require_evidence_labels'] } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    assert.equal(r.effective.hooks.command_guard, 'on');
    assert.equal(r.effective.hooks.write_guard, 'on');
    assert.equal(r.effective.verification.require_evidence_labels, true);
    assert.ok(r.errors.every((e) => /only the project config acknowledges it/.test(e.message)), JSON.stringify(r.errors));
  } finally { rmrf(dir); }
});

test('acknowledging a non-floored key is rejected; a stale acknowledgment warns', () => {
  let dir = projectWith({ version: 1, safety: { acknowledged_overrides: ['response.style'] } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    assert.match(r.errors[0].message, /not a safety-floored key/);
  } finally { rmrf(dir); }
  dir = projectWith({ version: 1, safety: { acknowledged_overrides: ['hooks.write_guard'] } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, true);
    assert.ok(r.warnings.some((w) => /does not lower any floor/.test(w.message)));
  } finally { rmrf(dir); }
});

test('conflicting values: PRODUCTION profile with weakened testing/review is an error unless acknowledged', () => {
  const dir = projectWith({ version: 1, profile: 'PRODUCTION', testing: { strategy: 'targeted' }, review: { depth: 'quick' } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, false);
    const msgs = r.errors.map((e) => e.message).join('\n');
    assert.match(msgs, /"testing.strategy" = "targeted" conflicts with profile PRODUCTION, whose minimum is "affected"/);
    assert.match(msgs, /"review.depth" = "quick" conflicts with profile PRODUCTION/);
    assert.equal(r.effective.testing.strategy, 'affected');
  } finally { rmrf(dir); }
});

test('TC-013 unsafe paths are rejected: absolute, traversal, home, drive letters', () => {
  for (const bad of ['../outside.md', '/etc/passwd', 'C:\\Windows\\x.md', '~/x.md', 'docs/../../x.md']) {
    const v = cfg.validateDocument({ version: 1, conventions: { extra_instructions_file: bad } }, { source: 't', projectRoot: process.cwd() });
    assert.ok(v.errors.some((e) => /must be a relative path inside the project/.test(e.message)), `rejects ${bad}`);
  }
  const v = cfg.validateDocument({ version: 1, hooks: { protected_paths: ['../**', '/abs/**'] } }, { source: 't' });
  assert.equal(v.errors.length, 2);
  const ok = cfg.validateDocument({ version: 1, conventions: { extra_instructions_file: 'docs/conventions.md' }, hooks: { protected_paths: ['migrations/**'] } }, { source: 't', projectRoot: process.cwd() });
  assert.equal(ok.errors.length, 0);
  assert.ok(ok.warnings.some((w) => /does not exist yet/.test(w.message)));
});

test('unsupported version is rejected with a migration pointer', () => {
  const v = cfg.validateDocument({ version: 2, profile: 'FAST' }, { source: 't' });
  assert.match(v.errors[0].message, /version 2 is not supported.*migration/);
});

test('--init writes a template once and never overwrites; --validate works on a file; --profiles prints the matrix', () => {
  const dir = tmpDir('init');
  try {
    let r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--init', 'PRODUCTION', '--project', dir]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /created: .*config\.json with profile PRODUCTION/);
    const file = path.join(dir, '.vz-skills', 'config.json');
    const before = fs.readFileSync(file, 'utf8');
    r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--init', 'FAST', '--project', dir]);
    assert.match(r.stdout, /exists: .*not overwritten/);
    assert.equal(fs.readFileSync(file, 'utf8'), before, 'file unchanged');
    r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--validate', file, '--project', dir]);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /^Valid$/m);
    r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--project', dir, '--no-user', '--summary']);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /profile: PRODUCTION \(from project\)/);
    r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--profiles']);
    assert.match(r.stdout, /testing\.strategy\s+targeted\s+affected\s+full/);
    r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--schema']);
    assert.equal(r.status, 0);
    assert.ok(JSON.parse(r.stdout).some((row) => row.key === 'hooks.command_guard' && row.floor.min === 'on'));
  } finally { rmrf(dir); }
});

test('example configs in docs/examples all validate', () => {
  const exDir = path.join(__dirname, '..', 'docs', 'examples');
  const files = fs.readdirSync(exDir).filter((f) => f.startsWith('config.') && f.endsWith('.json'));
  assert.ok(files.length >= 3);
  for (const f of files) {
    const r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--validate', path.join(exDir, f), '--project', exDir]);
    assert.equal(r.status, 0, `${f}: ${r.stdout}`);
  }
});

// ---------- JSON Schema (plugins/vz-skills/schema/config.v1.schema.json) ----------
const REPO = path.join(__dirname, '..');
const SCHEMA_FILE = path.join(REPO, 'plugins', 'vz-skills', 'schema', 'config.v1.schema.json');
const jsonSchema = () => JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'));

// Tiny draft-07 subset validator: exactly the keywords the generator emits. Returns a list of problems.
function checkSchema(schema, value, at = '$') {
  const bad = (m) => [`${at}: ${m}`];
  const t = schema.type;
  if (t === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return bad('expected object');
    const out = [];
    for (const [k, v] of Object.entries(value)) {
      if (!schema.properties[k]) { if (schema.additionalProperties === false) out.push(`${at}.${k}: unknown key`); continue; }
      out.push(...checkSchema(schema.properties[k], v, `${at}.${k}`));
    }
    return out;
  }
  if (t === 'array') {
    if (!Array.isArray(value)) return bad('expected array');
    const out = schema.maxItems !== undefined && value.length > schema.maxItems ? bad('too many items') : [];
    value.forEach((v, i) => out.push(...checkSchema(schema.items, v, `${at}[${i}]`)));
    return out;
  }
  if (typeof value !== t) return bad(`expected ${t}`);
  if (schema.const !== undefined && value !== schema.const) return bad(`must be ${schema.const}`);
  if (schema.enum && !schema.enum.includes(value)) return bad('not in enum');
  if (schema.maxLength !== undefined && value.length > schema.maxLength) return bad('too long');
  if (schema.pattern && !new RegExp(schema.pattern).test(value)) return bad('pattern mismatch');
  return [];
}

test('config.v1.schema.json is up to date with SCHEMA (gen-config-schema --check)', () => {
  const r = runNode(path.join(REPO, 'scripts', 'gen-config-schema.js'), ['--check']);
  assert.equal(r.status, 0, r.stderr);
});

test('JSON Schema covers every SCHEMA key with matching type, enum, limits and nesting', () => {
  const s = jsonSchema();
  assert.equal(s.additionalProperties, false);
  assert.equal(s.properties.$schema.type, 'string');
  assert.equal(s.properties.$comment.type, 'string');
  assert.equal(s.properties.version.const, cfg.CONFIG_VERSION);
  const floored = Object.keys(cfg.SCHEMA).filter((k) => cfg.SCHEMA[k].floor);
  for (const [key, spec] of Object.entries(cfg.SCHEMA)) {
    let node = s;
    for (const p of key.split('.')) {
      assert.equal(node.additionalProperties, false, `additionalProperties false above ${key}`);
      node = node.properties[p];
      assert.ok(node, `${key} present in JSON Schema`);
    }
    assert.ok(node.description.startsWith(spec.description), `${key} description`);
    if (spec.values) assert.deepEqual(node.enum, spec.values, `${key} enum`);
    if (spec.maxLength) assert.equal(node.maxLength, spec.maxLength, `${key} maxLength`);
    if (spec.type === 'string[]') { assert.equal(node.type, 'array'); assert.equal(node.maxItems, spec.maxItems); } else if (spec.type !== 'path') assert.equal(node.type, spec.type, `${key} type`);
  }
  assert.deepEqual(s.properties.safety.properties.acknowledged_overrides.items.enum, floored);
  assert.ok(floored.length >= 3);
});

test('JSON Schema and validateDocument agree on every key: allowed values pass, wrong types/values fail', () => {
  const s = jsonSchema();
  const agree = (key, value, label) => {
    const doc = {}; let cur = doc; const parts = key.split('.');
    parts.slice(0, -1).forEach((p) => { cur = cur[p] = {}; });
    cur[parts[parts.length - 1]] = value;
    const resolver = cfg.validateDocument(doc, { source: 't' }).errors.length === 0;
    const schema = checkSchema(s, doc).length === 0;
    assert.equal(schema, resolver, `${key} = ${JSON.stringify(value)} (${label}): resolver ${resolver}, schema ${schema}`);
  };
  for (const [key, spec] of Object.entries(cfg.SCHEMA)) {
    if (key === 'safety.acknowledged_overrides') continue; // covered below
    if (spec.values) { for (const v of spec.values) agree(key, v, 'allowed'); agree(key, 'nope', 'bad value'); agree(key, 5, 'bad type'); }
    else if (spec.type === 'boolean') { agree(key, true, 'ok'); agree(key, 'yes', 'bad type'); }
    else if (spec.type === 'string[]') { agree(key, ['a/**'], 'ok'); agree(key, [1], 'bad item'); agree(key, 'a', 'not array'); agree(key, Array(spec.maxItems + 1).fill('a'), 'too many'); }
    else if (spec.type === 'path') {
      agree(key, '', 'empty'); agree(key, 'docs/rules.md', 'ok'); agree(key, 5, 'bad type');
      for (const bad of ['/etc/x', '../x', 'a/../x', 'C:/x', 'C:\\x', '~/x', '\\\\srv\\x', 'a\\..\\x']) agree(key, bad, 'unsafe path');
    }
    if (spec.maxLength) { agree(key, 'x'.repeat(spec.maxLength), 'at limit'); agree(key, 'x'.repeat(spec.maxLength + 1), 'over limit'); }
  }
  agree('version', 1, 'ok'); agree('version', 2, 'unsupported'); agree('version', '1', 'bad type');
  agree('safety.acknowledged_overrides', ['hooks.command_guard'], 'floored key');
  agree('safety.acknowledged_overrides', ['testing.tdd'], 'non-floored key');
  agree('safety.acknowledged_overrides', ['nope'], 'unknown key');
  agree('hooks.protected_paths', ['../x'], 'escapes project');
  agree('hooks.protected_paths', ['/abs'], 'absolute');
  // unknown keys at every level are rejected; $schema/$comment are accepted
  assert.ok(checkSchema(s, { profil: 'FAST' }).length);
  assert.ok(checkSchema(s, { hooks: { command_gaurd: 'on' } }).length);
  assert.deepEqual(checkSchema(s, { $schema: 'x', $comment: 'y' }), []);
  assert.ok(checkSchema(s, { $schema: 5 }).length);
});

test('docs/examples reference the shipped schema by a relative path that resolves, and validate against it', () => {
  const exDir = path.join(REPO, 'docs', 'examples');
  const s = jsonSchema();
  const files = fs.readdirSync(exDir).filter((f) => f.startsWith('config.') && f.endsWith('.json'));
  assert.ok(files.length >= 4);
  for (const f of files) {
    const doc = JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf8'));
    assert.equal(path.resolve(exDir, doc.$schema), SCHEMA_FILE, `${f} $schema resolves to the shipped schema`);
    assert.deepEqual(checkSchema(s, doc), [], f);
  }
});

test('--init writes a $schema that resolves from the new config file to the shipped schema', () => {
  const dir = tmpDir('init-schema');
  try {
    const r = runNode(path.join(SCRIPTS, 'vz-config.js'), ['--init', 'BALANCED', '--project', dir]);
    assert.equal(r.status, 0, r.stderr);
    const file = path.join(dir, '.vz-skills', 'config.json');
    const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.ok(!doc.$schema.includes('vz-skills.local'));
    assert.ok(!doc.$schema.includes('\\'), 'forward slashes only');
    assert.equal(path.resolve(path.dirname(file), doc.$schema), SCHEMA_FILE);
    assert.deepEqual(checkSchema(jsonSchema(), doc), []);
  } finally { rmrf(dir); }
});

test('schemaRefFrom gives a relative path for a vendored layout and a file: URL when none exists', () => {
  assert.equal(cfg.schemaRefFrom(path.join(REPO, '.vz-skills')), '../plugins/vz-skills/schema/config.v1.schema.json');
  if (process.platform === 'win32') {
    const other = path.parse(SCHEMA_FILE).root.toUpperCase().startsWith('Z') ? 'A:\\x' : 'Z:\\x';
    assert.match(cfg.schemaRefFrom(other), /^file:\/\/\//);
  }
});
