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

test('flat (unprefixed) install at user scope: skills/agents/runtime/hooks created, references rewritten, uninstall restores settings', { skip: skipLive, timeout: 300000 }, () => {
  const dir = tmpDir('flat-user');
  const cfg = path.join(dir, 'cfg');
  fs.mkdirSync(cfg, { recursive: true });
  const existing = { theme: 'dark', hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo user-hook' }] }] } };
  fs.writeFileSync(path.join(cfg, 'settings.json'), JSON.stringify(existing));
  const env = { CLAUDE_CONFIG_DIR: cfg, VZ_SKILLS_HOME: path.join(dir, 'home') };
  try {
    let r = cli(['install', '--flat'], env, 120000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const skills = fs.readdirSync(path.join(cfg, 'skills')).sort();
    const expectedCount = require('./helpers').listSkillDirs().length;
    assert.equal(skills.length, expectedCount);
    assert.ok(skills.includes('vz-status') && !skills.includes('status'), 'status renamed to vz-status');
    assert.ok(skills.includes('plan') && skills.includes('discover'));
    const plan = fs.readFileSync(path.join(cfg, 'skills', 'plan', 'SKILL.md'), 'utf8');
    assert.doesNotMatch(plan, /CLAUDE_PLUGIN_ROOT|\/vz-skills:/, 'plugin references rewritten');
    const clarify = fs.readFileSync(path.join(cfg, 'skills', 'clarify', 'SKILL.md'), 'utf8');
    assert.match(clarify, /vz-skills\/references\/risk-tiers\.md/, 'reference path rewritten to the runtime directory');
    assert.doesNotMatch(clarify, /CLAUDE_PLUGIN_ROOT/);
    assert.match(fs.readFileSync(path.join(cfg, 'skills', 'vz-status', 'SKILL.md'), 'utf8'), /^name: vz-status$/m);
    assert.match(fs.readFileSync(path.join(cfg, 'skills', 'using-vz-skills', 'SKILL.md'), 'utf8'), /`\/discover`|\/discover\b/);
    assert.equal(fs.readdirSync(path.join(cfg, 'agents')).length, 3);
    assert.doesNotMatch(fs.readFileSync(path.join(cfg, 'skills', 'review', 'SKILL.md'), 'utf8'), /vz-skills:independent-reviewer/);
    const settings = JSON.parse(fs.readFileSync(path.join(cfg, 'settings.json'), 'utf8'));
    assert.equal(settings.theme, 'dark', 'unrelated settings preserved');
    assert.equal(settings.hooks.PreToolUse[0].hooks[0].command, 'echo user-hook', 'existing hook preserved and first');
    assert.equal(settings.hooks.PreToolUse.length, 3);
    assert.equal(settings.hooks.SessionStart.length, 1);
    const guard = settings.hooks.PreToolUse[1].hooks[0];
    assert.equal(guard.command, 'node');
    assert.ok(fs.existsSync(guard.args[0]), 'hook script path exists');
    // the official validator accepts the installed skills and agents
    for (const d of ['skills', 'agents']) {
      const v = spawnSync('claude', ['plugin', 'validate', path.join(cfg, d), '--strict'], { encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000, windowsHide: true });
      assert.equal(v.status, 0, `${d}: ${v.stdout}${v.stderr}`);
    }
    // the relocated session hook works from the runtime directory
    const hook = spawnSync(process.execPath, [path.join(cfg, 'vz-skills', 'scripts', 'hooks', 'session-context.js')], { input: JSON.stringify({ hook_event_name: 'SessionStart', cwd: path.join(REPO_ROOT, 'fixtures', 'ts-app') }), encoding: 'utf8', windowsHide: true });
    const ctx = JSON.parse(hook.stdout).hookSpecificOutput.additionalContext;
    assert.match(ctx, /VZ Skills core policy/);
    assert.match(ctx, /`\/discover`/, 'policy text rewritten to unprefixed command');
    // doctor sees it; a second install without --force refuses nothing (managed markers), update works
    r = cli(['doctor'], env, 120000);
    assert.match(r.stdout, new RegExp(`Unprefixed \\(flat\\) user install: \\d+\\.\\d+\\.\\d+ \\(${expectedCount} skills, 3 agents\\)`));
    r = cli(['update', '--flat'], env, 120000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // a foreign skill with the same name is protected unless --force
    fs.rmSync(path.join(cfg, 'skills', 'plan', '.vz-skills-managed'));
    r = cli(['install', '--flat'], env, 120000);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /not created by vz-skills: plan/);
    r = cli(['install', '--flat', '--force'], env, 120000);
    assert.equal(r.status, 0);
    // uninstall
    r = cli(['uninstall', '--flat'], env, 120000);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(!fs.existsSync(path.join(cfg, 'skills')), 'empty skills dir removed');
    assert.ok(!fs.existsSync(path.join(cfg, 'vz-skills')));
    const after = JSON.parse(fs.readFileSync(path.join(cfg, 'settings.json'), 'utf8'));
    assert.deepEqual(after, existing, 'settings restored to the pre-install content');
    assert.ok(fs.readdirSync(cfg).some((f) => f.startsWith('settings.json.vz-backup-')), 'backup kept');
  } finally { rmrf(dir); }
});

test('flat install at project scope is portable: ${CLAUDE_PROJECT_DIR} paths, validator passes on .claude, uninstall cleans', { skip: skipLive, timeout: 300000 }, () => {
  const dir = tmpDir('flat-proj');
  fs.cpSync(path.join(REPO_ROOT, 'fixtures', 'ts-app'), dir, { recursive: true });
  const env = { CLAUDE_CONFIG_DIR: path.join(dir, '..', `flat-proj-cfg-${process.pid}`), VZ_SKILLS_HOME: path.join(dir, 'home') };
  fs.mkdirSync(env.CLAUDE_CONFIG_DIR, { recursive: true });
  try {
    let r = spawnSync(process.execPath, [BIN, 'install', '--flat', '--scope', 'project'], { encoding: 'utf8', cwd: dir, env: Object.assign({}, process.env, env), timeout: 120000, windowsHide: true });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const settings = JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8'));
    assert.equal(settings.hooks.PreToolUse[0].hooks[0].args[0], '${CLAUDE_PROJECT_DIR}/.claude/vz-skills/scripts/hooks/command-guard.js');
    const discover = fs.readFileSync(path.join(dir, '.claude', 'skills', 'discover', 'SKILL.md'), 'utf8');
    assert.match(discover, /\$\{CLAUDE_PROJECT_DIR\}\/\.claude\/vz-skills\/scripts\/vz-discover\.js/);
    assert.doesNotMatch(JSON.stringify(settings) + discover, /[A-Z]:\\|\/Users\//, 'no machine-specific absolute paths in committed files');
    const v = spawnSync('claude', ['plugin', 'validate', dir, '--strict'], { encoding: 'utf8', shell: process.platform === 'win32', timeout: 120000, windowsHide: true });
    assert.equal(v.status, 0, v.stdout + v.stderr);
    const guard = spawnSync(process.execPath, [path.join(dir, '.claude', 'vz-skills', 'scripts', 'hooks', 'command-guard.js')], { input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', cwd: dir, tool_input: { command: 'rm -rf /' } }), encoding: 'utf8', windowsHide: true });
    assert.match(guard.stdout, /"permissionDecision":"deny"/);
    r = spawnSync(process.execPath, [BIN, 'uninstall', '--flat', '--scope', 'project'], { encoding: 'utf8', cwd: dir, env: Object.assign({}, process.env, env), timeout: 120000, windowsHide: true });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills')));
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'vz-skills')));
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf8')), {});
  } finally { rmrf(dir); rmrf(env.CLAUDE_CONFIG_DIR); }
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
