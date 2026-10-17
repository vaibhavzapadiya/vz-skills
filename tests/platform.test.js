'use strict';
// Platform integration: the official validator, session-only loading, component inventory.
// Requirement IDs: REQ-001, REQ-002, REQ-009, REQ-016 (TC-001, TC-016).
// These tests run only when the `claude` CLI is on PATH; otherwise they are skipped and reported as such.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO_ROOT, PLUGIN_ROOT, hasClaude } = require('./helpers');

const claudeVersion = hasClaude();
const skip = claudeVersion ? false : 'claude CLI not found on PATH';
// `plugin validate --json` arrived in Claude Code 2.1.259; older CLIs still run the non-JSON checks below.
const atLeast = (v, min) => { const a = (v.match(/d+(.d+)*/) || ['0'])[0].split('.').map(Number); const b = min.split('.').map(Number); for (let i = 0; i < 3; i++) if ((a[i] || 0) !== b[i]) return (a[i] || 0) > b[i]; return true; };
const skipJson = skip || (atLeast(claudeVersion, '2.1.259') ? false : `claude ${claudeVersion} predates validate --json (2.1.259)`);

function claude(args, opts = {}) {
  const r = spawnSync('claude', args, { encoding: 'utf8', shell: process.platform === 'win32', cwd: opts.cwd || REPO_ROOT, timeout: opts.timeout || 120000, windowsHide: true, env: Object.assign({}, process.env, { CLAUDE_CODE_SIMPLE: '1' }) });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

test('claude plugin validate --strict --json passes for the plugin', { skip: skipJson }, () => {
  const r = claude(['plugin', 'validate', PLUGIN_ROOT, '--strict', '--json']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const report = JSON.parse(r.stdout);
  assert.equal(report.success, true);
  assert.equal(report.strict, true);
  assert.deepEqual(report.manifest.errors, []);
  assert.deepEqual(report.manifest.warnings, []);
});

test('claude plugin validate --strict passes for the marketplace at the repo root', { skip }, () => {
  const r = claude(['plugin', 'validate', REPO_ROOT, '--strict']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /Validation passed/);
});

test('claude plugin validate --strict passes for the skills and agents directories on their own', { skip }, () => {
  for (const dir of ['skills', 'agents']) {
    const r = claude(['plugin', 'validate', path.join(PLUGIN_ROOT, dir), '--strict']);
    assert.equal(r.status, 0, `${dir}: ${r.stdout}${r.stderr}`);
  }
});

test('plugin loads as a session-only plugin via --plugin-dir and lists every component', { skip }, () => {
  const list = claude(['--plugin-dir', PLUGIN_ROOT, 'plugin', 'list']);
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /vz-skills@inline/);
  assert.match(list.stdout, /Status: .*loaded/);
  const details = claude(['--plugin-dir', PLUGIN_ROOT, 'plugin', 'details', 'vz-skills']);
  assert.equal(details.status, 0, details.stderr);
  const skillDirs = require('./helpers').listSkillDirs().map((s) => s.name).sort();
  const m = details.stdout.match(/Skills \((\d+)\)\s+(.+)/);
  assert.ok(m, 'skills line present');
  assert.equal(Number(m[1]), skillDirs.length);
  assert.deepEqual(m[2].split(',').map((s) => s.trim()).sort(), skillDirs);
  const a = details.stdout.match(/Agents \((\d+)\)\s+(.+)/);
  assert.equal(Number(a[1]), 3);
  assert.match(details.stdout, /Hooks \(2\)\s+PreToolUse, SessionStart/);
  const cost = details.stdout.match(/Always-on:\s+~([\d,]+) tok/);
  assert.ok(cost, 'always-on cost reported');
  assert.ok(Number(cost[1].replace(/,/g, '')) < 4000, `always-on cost ${cost[1]} should stay small`);
});

test('records the Claude Code version used for platform evidence', { skip }, () => {
  assert.match(claudeVersion, /^\d+\.\d+\.\d+/);
  fs.mkdirSync(path.join(REPO_ROOT, 'tests', '.tmp'), { recursive: true });
  fs.writeFileSync(path.join(REPO_ROOT, 'tests', '.tmp', 'claude-version.txt'), claudeVersion + '\n');
});
