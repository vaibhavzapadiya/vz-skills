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

test('safety floors: acknowledged override is applied but loudly warned every time', () => {
  const dir = projectWith({ version: 1, hooks: { command_guard: 'off' }, safety: { acknowledged_overrides: ['hooks.command_guard'] } });
  try {
    const r = cfg.resolveConfig({ projectRoot: dir, userConfigPath: null, env: {} });
    assert.equal(r.ok, true, JSON.stringify(r.errors));
    assert.equal(r.effective.hooks.command_guard, 'off');
    assert.ok(r.warnings.some((w) => /SAFETY DOWNGRADE acknowledged: "hooks.command_guard"/.test(w.message)));
    assert.match(cfg.summaryText(r), /WARNING: SAFETY DOWNGRADE/);
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
