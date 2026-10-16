'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const PLUGIN_ROOT = path.join(REPO_ROOT, 'plugins', 'vz-skills');
const SCRIPTS = path.join(PLUGIN_ROOT, 'scripts');
const FIXTURES = path.join(REPO_ROOT, 'fixtures');
const TMP_ROOT = path.join(REPO_ROOT, 'tests', '.tmp');

function tmpDir(name) {
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  const dir = fs.mkdtempSync(path.join(TMP_ROOT, `${name}-`));
  return dir;
}

function rmrf(p) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* ignore */ }
}

function copyFixture(name, dest) {
  fs.cpSync(path.join(FIXTURES, name), dest, { recursive: true });
  // fixtures store a `_gitignore` file so the repo's own .gitignore does not hide them
  const gi = path.join(dest, '_gitignore');
  if (fs.existsSync(gi)) fs.renameSync(gi, path.join(dest, '.gitignore'));
  // `_env` becomes `.env` for sensitive-path tests
  const env = path.join(dest, '_env');
  if (fs.existsSync(env)) fs.renameSync(env, path.join(dest, '.env'));
  return dest;
}

function runNode(script, args = [], opts = {}) {
  const r = spawnSync(process.execPath, [script, ...args], { encoding: 'utf8', cwd: opts.cwd || REPO_ROOT, env: Object.assign({}, process.env, opts.env || {}), input: opts.input, timeout: opts.timeout || 60000, windowsHide: true });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

function runHook(hookScript, inputObj, env = {}) {
  const started = process.hrtime.bigint();
  const r = runNode(path.join(SCRIPTS, 'hooks', hookScript), [], { input: typeof inputObj === 'string' ? inputObj : JSON.stringify(inputObj), env, timeout: 20000 });
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  let json = null;
  try { json = r.stdout.trim() ? JSON.parse(r.stdout) : null; } catch { json = null; }
  return Object.assign(r, { json, ms });
}

function hasClaude() {
  const r = spawnSync('claude', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32', timeout: 20000, windowsHide: true });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

function git(dir, args) {
  return spawnSync('git', args, { cwd: dir, encoding: 'utf8', windowsHide: true, env: Object.assign({}, process.env, { GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' }) });
}

/** Every skill directory the platform would load, as [{name, dir, rel, group}] (see scripts/lib/skills.js). */
function listSkillDirs(pluginRoot = PLUGIN_ROOT) {
  return require(path.join(pluginRoot, 'scripts', 'lib', 'skills.js')).listSkills(pluginRoot).skills;
}

module.exports = { REPO_ROOT, PLUGIN_ROOT, SCRIPTS, FIXTURES, TMP_ROOT, tmpDir, rmrf, copyFixture, runNode, runHook, hasClaude, git, listSkillDirs };
