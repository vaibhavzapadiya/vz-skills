'use strict';
// Documentation accuracy: docs must agree with the implementation. Requirement IDs: REQ-017, REQ-005.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { REPO_ROOT, PLUGIN_ROOT, SCRIPTS, runNode } = require('./helpers');
const cfg = require(path.join(SCRIPTS, 'lib', 'config.js'));

test('every config schema key is documented in docs/configuration.md, and no undocumented key is claimed', () => {
  const doc = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'configuration.md'), 'utf8');
  for (const key of Object.keys(cfg.SCHEMA)) assert.ok(doc.includes(`\`${key}\``), `documented: ${key}`);
  const documented = [...doc.matchAll(/^\| `([a-z_.]+)` \|/gm)].map((m) => m[1]).filter((k) => k.includes('.') || k === 'version' || k === 'profile');
  for (const k of documented) assert.ok(cfg.SCHEMA[k], `doc row for unknown key ${k}`);
});

test('the profile matrix in docs/configuration.md matches the presets', () => {
  const doc = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'configuration.md'), 'utf8');
  for (const row of cfg.profileDiff()) {
    const re = new RegExp(`^\\| ${row.key.replace(/\./g, '\\.')} \\| ${row.FAST} \\| ${row.BALANCED}[^|]*\\| ${row.PRODUCTION} \\|`, 'm');
    assert.match(doc, re, `matrix row for ${row.key}`);
  }
});

test('docs/skills-catalog.md is generated from the current frontmatter', () => {
  const r = runNode(path.join(REPO_ROOT, 'scripts', 'gen-catalog.js'), ['--check']);
  assert.equal(r.status, 0, r.stderr);
});

test('README, install and hooks docs state the real component counts', () => {
  const { listSkillDirs } = require('./helpers');
  const skills = listSkillDirs().length;
  const agents = fs.readdirSync(path.join(PLUGIN_ROOT, 'agents')).length;
  const readme = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  assert.match(readme, new RegExp(`${skills} skills`));
  assert.match(readme, new RegExp(`${agents} agents`));
  const install = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'install.md'), 'utf8');
  assert.match(install, new RegExp(`${skills} skills, ${agents} agents`));
});

test('every docs/*.md relative link resolves', () => {
  const docsDir = path.join(REPO_ROOT, 'docs');
  for (const f of fs.readdirSync(docsDir).filter((x) => x.endsWith('.md'))) {
    const text = fs.readFileSync(path.join(docsDir, f), 'utf8');
    for (const m of text.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target) continue;
      assert.ok(fs.existsSync(path.resolve(docsDir, target)), `${f}: link target missing ${target}`);
    }
  }
});

test('plugin version is consistent across manifest, changelog, and workspace package', () => {
  const version = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  const changelog = fs.readFileSync(path.join(REPO_ROOT, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, new RegExp(`## \\[${version.replace(/\./g, '\\.')}\\]`));
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.version, version);
});

test('license is MIT in the manifest, workspace package, and LICENSE files', () => {
  const m = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));
  assert.equal(m.license, 'MIT');
  assert.equal(JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')).license, 'MIT');
  for (const f of [path.join(REPO_ROOT, 'LICENSE'), path.join(PLUGIN_ROOT, 'LICENSE')]) assert.match(fs.readFileSync(f, 'utf8'), /^MIT License/);
});

test('skills reference only scripts and references that exist', () => {
  const { listSkillDirs } = require('./helpers');
  const skills = listSkillDirs();
  const names = new Set(skills.map((s) => s.name));
  for (const s of skills) {
    const d = s.name;
    const text = fs.readFileSync(path.join(s.dir, 'SKILL.md'), 'utf8');
    for (const m of text.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([A-Za-z0-9_./-]+)/g)) assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, m[1])), `${d}: ${m[1]}`);
    for (const m of text.matchAll(/\/vz-skills:([a-z-]+)/g)) assert.ok(names.has(m[1]) || ['<name>', '<skill>'].includes(m[1]), `${d}: references unknown skill ${m[1]}`);
    for (const m of text.matchAll(/vz-skills:(repo-analyst|independent-reviewer|security-reviewer)/g)) assert.ok(fs.existsSync(path.join(PLUGIN_ROOT, 'agents', `${m[1]}.md`)));
  }
});
