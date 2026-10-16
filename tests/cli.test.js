'use strict';
// The `vz-skills` npm CLI (bin/vz-skills.js). Read-only commands always run; the install/uninstall cycle
// runs only when the `claude` CLI is present and uses an isolated CLAUDE_CONFIG_DIR + VZ_SKILLS_HOME so the
// developer's own Claude Code settings are never touched. Requirement IDs: REQ-016, REQ-019.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO_ROOT, PLUGIN_ROOT, tmpDir, rmrf, hasClaude } = require('./helpers');

const BIN = path.join(REPO_ROOT, 'bin', 'vz-skills.js');
const claudeVersion = hasClaude();
const skipLive = claudeVersion ? false : 'claude CLI not found on PATH';

function cli(args, env = {}, timeout = 60000) {
  const r = spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', cwd: REPO_ROOT, env: Object.assign({}, process.env, env), timeout, windowsHide: true });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

test('package.json is publishable: name, bin, files whitelist excludes tests/fixtures/docs', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'vz-skills');
  assert.equal(pkg.private, undefined);
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.bin['vz-skills'], 'bin/vz-skills.js');
  assert.ok(pkg.files.includes('plugins/vz-skills/') && pkg.files.includes('bin/') && pkg.files.includes('.claude-plugin/'));
  assert.ok(!pkg.files.some((f) => /^(tests|fixtures|docs|scripts)\//.test(f)));
  const manifestVersion = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
  assert.equal(pkg.version, manifestVersion, 'npm version tracks the plugin version');
});

test('help, path, version, and unknown command', () => {
  let r = cli(['--help']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /npx vz-skills install/);
  r = cli(['path']);
  assert.equal(r.status, 0);
  assert.equal(path.resolve(r.stdout.trim()), PLUGIN_ROOT);
  r = cli(['version']);
  assert.match(r.stdout.trim(), /^\d+\.\d+\.\d+$/);
  r = cli(['bogus']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /unknown command "bogus"/);
  r = cli(['install', '--scope', 'galaxy']);
  assert.equal(r.status, 2);
});

test('doctor reports a broken project config without touching it', () => {
  const dir = tmpDir('doctor');
  try {
    fs.mkdirSync(path.join(dir, '.vz-skills'));
    fs.writeFileSync(path.join(dir, '.vz-skills', 'config.json'), JSON.stringify({ version: 1, profil: 'FAST' }));
    const before = fs.readFileSync(path.join(dir, '.vz-skills', 'config.json'), 'utf8');
    const r = spawnSync(process.execPath, [BIN, 'doctor'], { encoding: 'utf8', cwd: dir, env: Object.assign({}, process.env, { CLAUDE_CONFIG_DIR: path.join(dir, 'cfg'), VZ_SKILLS_HOME: path.join(dir, 'home') }), timeout: 60000, windowsHide: true });
    assert.match(r.stdout, /Project config .* has errors:/);
    assert.match(r.stdout, /unknown key "profil"/);
    assert.equal(r.status, 1);
    assert.equal(fs.readFileSync(path.join(dir, '.vz-skills', 'config.json'), 'utf8'), before);
  } finally { rmrf(dir); }
});

test('install, list, update, uninstall --purge against an isolated Claude config directory', { skip: skipLive, timeout: 300000 }, () => {
  const dir = tmpDir('npx');
  const env = { CLAUDE_CONFIG_DIR: path.join(dir, 'cfg'), VZ_SKILLS_HOME: path.join(dir, 'home') };
  fs.mkdirSync(env.CLAUDE_CONFIG_DIR, { recursive: true });
  try {
    let r = cli(['install', '--scope', 'user'], env, 240000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /Copied plugin \d+\.\d+\.\d+/);
    assert.match(r.stdout, /Successfully installed plugin: vz-skills@vz-skills-marketplace/);
    assert.ok(fs.existsSync(path.join(env.VZ_SKILLS_HOME, 'marketplace', 'plugins', 'vz-skills', '.claude-plugin', 'plugin.json')));
    assert.ok(fs.existsSync(path.join(env.VZ_SKILLS_HOME, 'marketplace', '.claude-plugin', 'marketplace.json')));
    assert.ok(!fs.existsSync(path.join(env.VZ_SKILLS_HOME, 'marketplace', 'plugins', 'vz-skills', 'evals', 'results')), 'eval results never copied');
    const settings = JSON.parse(fs.readFileSync(path.join(env.CLAUDE_CONFIG_DIR, 'settings.json'), 'utf8'));
    assert.equal(settings.enabledPlugins['vz-skills@vz-skills-marketplace'], true, 'enabled in the isolated settings only');
    const list = spawnSync('claude', ['plugin', 'list'], { encoding: 'utf8', shell: process.platform === 'win32', env: Object.assign({}, process.env, env), timeout: 120000, windowsHide: true });
    assert.match(list.stdout, /vz-skills@vz-skills-marketplace/);
    r = cli(['doctor'], env, 120000);
    assert.match(r.stdout, /Marketplace vz-skills-marketplace registered/);
    assert.match(r.stdout, /Plugin vz-skills@vz-skills-marketplace installed/);
    r = cli(['update'], env, 240000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    r = cli(['uninstall', '--purge'], env, 240000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(!fs.existsSync(path.join(env.VZ_SKILLS_HOME, 'marketplace')), 'managed copy removed');
    const after = JSON.parse(fs.readFileSync(path.join(env.CLAUDE_CONFIG_DIR, 'settings.json'), 'utf8'));
    assert.ok(!after.enabledPlugins || after.enabledPlugins['vz-skills@vz-skills-marketplace'] === undefined, 'plugin entry removed');
  } finally { rmrf(dir); }
});
