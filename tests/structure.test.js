'use strict';
// Structural validation of the plugin: manifest, skills, agents, hooks.
// Requirement IDs: REQ-001, REQ-002, REQ-003, REQ-009, REQ-010, REQ-011.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PLUGIN_ROOT, REPO_ROOT, SCRIPTS, runNode } = require('./helpers');
const { validatePlugin } = require(path.join(SCRIPTS, 'vz-validate.js'));
const { parseFrontmatter } = require(path.join(SCRIPTS, 'lib', 'frontmatter.js'));

test('frontmatter parser handles scalars, booleans, inline and block lists, nested maps', () => {
  const r = parseFrontmatter('---\nname: x\ndescription: "quoted: value"\nflag: true\nlist: [a, b]\nblock:\n  - one\n  - two\nnested:\n  k: v\n---\nbody');
  assert.equal(r.hasFrontmatter, true);
  assert.deepEqual(r.data, { name: 'x', description: 'quoted: value', flag: true, list: ['a', 'b'], block: ['one', 'two'], nested: { k: 'v' } });
  assert.equal(r.body, 'body');
  assert.deepEqual(r.warnings, []);
});

test('frontmatter parser reports missing or unterminated frontmatter', () => {
  assert.equal(parseFrontmatter('# no frontmatter').hasFrontmatter, false);
  assert.equal(parseFrontmatter('---\nname: x\nno end').hasFrontmatter, false);
  assert.ok(parseFrontmatter('---\nname: x\nname: y\n---\n').warnings.some((w) => /duplicate/.test(w)));
});

test('plugin manifest exists, is valid JSON, and uses a kebab-case non-reserved name', () => {
  const m = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(m.name, 'vz-skills');
  assert.match(m.version, /^\d+\.\d+\.\d+$/);
  assert.ok(m.description.length > 20);
  assert.ok(m.author && m.author.name);
});

test('marketplace manifest points at the plugin with a ./ relative source', () => {
  const m = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json'), 'utf8'));
  assert.equal(m.name, 'vz-skills-marketplace');
  assert.ok(m.owner && m.owner.name);
  const entry = m.plugins.find((p) => p.name === 'vz-skills');
  assert.ok(entry, 'vz-skills entry present');
  assert.equal(entry.source, './plugins/vz-skills');
  assert.ok(fs.existsSync(path.join(REPO_ROOT, entry.source, '.claude-plugin', 'plugin.json')));
});

test('vz-validate reports zero errors for the shipped plugin', () => {
  const r = validatePlugin(PLUGIN_ROOT);
  assert.deepEqual(r.errors, [], `errors: ${JSON.stringify(r.errors, null, 2)}`);
  assert.ok(r.info.skills.length >= 1, 'at least one skill');
});

test('vz-validate CLI exits 0 and prints a summary', () => {
  const r = runNode(path.join(SCRIPTS, 'vz-validate.js'), [PLUGIN_ROOT]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Validation passed/);
});

test('every skill has a unique name, a description, a real body, and only supported fields', () => {
  const { listSkillDirs } = require('./helpers');
  const skills = listSkillDirs();
  assert.ok(skills.length >= 19, 'skills discovered through the platform scan rules');
  const seen = new Set();
  for (const s of skills) {
    const d = s.name;
    const { data, body, hasFrontmatter } = parseFrontmatter(fs.readFileSync(path.join(s.dir, 'SKILL.md'), 'utf8'));
    assert.equal(hasFrontmatter, true, `${d}: frontmatter`);
    assert.ok(!seen.has(d), `${d}: duplicate`);
    seen.add(d);
    assert.ok(typeof data.description === 'string' && data.description.length >= 20, `${d}: description`);
    assert.ok(body.length > 200, `${d}: body`);
    assert.ok(/## /.test(body), `${d}: has sections`);
  }
});

test('skill groups: every group folder is listed in plugin.json, so no skill is silently unreachable', () => {
  const { listSkills } = require(path.join(SCRIPTS, 'lib', 'skills.js'));
  const scan = listSkills(PLUGIN_ROOT);
  assert.deepEqual(scan.unreachable, [], 'unreachable skills');
  assert.ok(scan.groups.length >= 4, 'grouped layout');
  for (const g of scan.groups) assert.ok(g.listed && g.count > 0, `${g.rel} listed and non-empty`);
  const manifest = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  for (const rel of manifest.skills) assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, rel)), `manifest skills path exists: ${rel}`);
  // the trap this guards against: a group folder missing from the manifest passes `claude plugin validate`
  // but loads zero skills at runtime (observed on Claude Code 2.1.259). vz-validate must report it as an error.
  const { tmpDir, rmrf } = require('./helpers');
  const dir = tmpDir('unlisted');
  try {
    fs.cpSync(PLUGIN_ROOT, dir, { recursive: true, filter: (p) => !/[\\/]evals[\\/]results/.test(p) });
    const mp = path.join(dir, '.claude-plugin', 'plugin.json');
    const m = JSON.parse(fs.readFileSync(mp, 'utf8'));
    m.skills = m.skills.filter((s) => s !== './skills/productivity');
    fs.writeFileSync(mp, JSON.stringify(m, null, 2));
    const r = validatePlugin(dir);
    const msgs = r.errors.map((e) => e.message).join('\n');
    assert.match(msgs, /skill would not load: group directory \.\/skills\/productivity is not listed/);
    assert.equal(listSkills(dir).unreachable.length, 5);
    assert.equal(listSkills(dir).skills.length, listSkills(PLUGIN_ROOT).skills.length - 5);
  } finally { rmrf(dir); }
});

test('vz-validate catches a broken skill (unsupported field, bad name, missing description)', () => {
  const { tmpDir, rmrf } = require('./helpers');
  const dir = tmpDir('badplugin');
  try {
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'Bad Name', bogus: 1 }));
    fs.mkdirSync(path.join(dir, 'skills', 'Bad_Skill'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'skills', 'Bad_Skill', 'SKILL.md'), '---\nname: other\ntrigger: x\n---\nshort');
    fs.mkdirSync(path.join(dir, 'agents'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'agents', 'a.md'), '---\nname: a\ndescription: d\npermissionMode: auto\n---\nshort');
    fs.mkdirSync(path.join(dir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'hooks', 'hooks.json'), JSON.stringify({ PreToolUse: [] }));
    const r = validatePlugin(dir);
    const msgs = r.errors.map((e) => e.message).join('\n');
    assert.match(msgs, /kebab-case/);
    assert.match(msgs, /unsupported frontmatter field "trigger"/);
    assert.match(msgs, /differs from directory name/);
    assert.match(msgs, /description missing/);
    assert.match(msgs, /ignored for plugin agents/);
    assert.match(msgs, /top-level "hooks" key/);
    assert.ok(r.warnings.some((w) => /unknown manifest field "bogus"/.test(w.message)));
  } finally { rmrf(dir); }
});
