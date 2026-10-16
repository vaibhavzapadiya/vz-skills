#!/usr/bin/env node
'use strict';
/**
 * vz-skills CLI: one-command install of the VZ Skills plugin for Claude Code.
 *
 *   npx vz-skills install [--scope user|project|local]   copy the plugin to ~/.vz-skills/marketplace,
 *                                                         register it as a Claude Code marketplace, install it
 *                                                         -> commands appear as /vz-skills:<name>
 *   npx vz-skills install --flat [--scope ...] [--force]   unprefixed: install as personal (user) or project skills
 *                                                         -> commands appear as /<name> (status becomes /vz-status)
 *   npx vz-skills update [--flat]                          refresh the installed copy
 *   npx vz-skills uninstall [--flat] [--scope ...] [--purge]   uninstall; --purge also removes the marketplace and the copy
 *   npx vz-skills try [claude args...]                     start Claude Code with the plugin loaded for one session
 *   npx vz-skills doctor                                   check Node, Claude Code, marketplace, plugin, project config
 *   npx vz-skills path                                     print the plugin directory (for --plugin-dir)
 *   npx vz-skills validate                                 run `claude plugin validate --strict` on the bundled plugin
 *
 * Environment: CLAUDE_CONFIG_DIR is honoured by Claude Code and passes through, so an install can be
 * tested against an isolated settings directory. VZ_SKILLS_HOME overrides ~/.vz-skills.
 * Exit codes: 0 ok, 1 a step failed (its output is shown), 2 usage error.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const flat = require('./lib/flat');

const PKG_ROOT = path.resolve(__dirname, '..');
const PLUGIN_SRC = path.join(PKG_ROOT, 'plugins', 'vz-skills');
const MARKETPLACE_SRC = path.join(PKG_ROOT, '.claude-plugin', 'marketplace.json');
const MARKETPLACE_NAME = 'vz-skills-marketplace';
const PLUGIN_ID = `vz-skills@${MARKETPLACE_NAME}`;
const HOME = process.env.VZ_SKILLS_HOME ? path.resolve(process.env.VZ_SKILLS_HOME) : path.join(os.homedir(), '.vz-skills');
const MARKET_DIR = path.join(HOME, 'marketplace');
const IS_WIN = process.platform === 'win32';

const version = () => JSON.parse(fs.readFileSync(path.join(PLUGIN_SRC, '.claude-plugin', 'plugin.json'), 'utf8')).version;
const log = (s) => process.stdout.write(s + '\n');
const fail = (s, code = 1) => { process.stderr.write(`vz-skills: ${s}\n`); process.exit(code); };

function claude(args, opts = {}) {
  const r = spawnSync('claude', args, Object.assign({ encoding: 'utf8', shell: IS_WIN, windowsHide: true, timeout: opts.timeout || 180000, stdio: opts.inherit ? 'inherit' : 'pipe' }, opts.spawn || {}));
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

function requireClaude() {
  const r = claude(['--version'], { timeout: 30000 });
  if (r.error || r.status !== 0) fail('Claude Code CLI not found on PATH. Install it first (https://code.claude.com/docs), then run this command again.');
  return r.stdout.trim();
}

function parseScope(argv) {
  const i = argv.findIndex((a) => a === '--scope' || a === '-s');
  if (i === -1) return 'user';
  const v = argv[i + 1];
  if (!['user', 'project', 'local'].includes(v)) fail('--scope must be user, project, or local', 2);
  return v;
}

function copyPlugin() {
  fs.mkdirSync(path.join(MARKET_DIR, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(path.join(MARKET_DIR, 'plugins'), { recursive: true });
  const dest = path.join(MARKET_DIR, 'plugins', 'vz-skills');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(PLUGIN_SRC, dest, { recursive: true, filter: (src) => !/[\\/]evals[\\/]results([\\/]|$)/.test(src) });
  fs.copyFileSync(MARKETPLACE_SRC, path.join(MARKET_DIR, '.claude-plugin', 'marketplace.json'));
  fs.writeFileSync(path.join(MARKET_DIR, 'INSTALLED-BY.txt'), `vz-skills npm package ${version()} on ${new Date().toISOString()}\nThis directory is managed by \`npx vz-skills\`; edits here are overwritten on update.\n`);
  return dest;
}

function marketplaceRegistered() {
  const r = claude(['plugin', 'marketplace', 'list']);
  if (r.status !== 0) return { listed: false, raw: r.stdout + r.stderr };
  const text = r.stdout;
  const idx = text.indexOf(MARKETPLACE_NAME);
  if (idx === -1) return { listed: false, raw: text };
  const block = text.slice(idx, idx + 400);
  const m = block.match(/(?:Source|Path|path):?\s*(\S.*)/i);
  return { listed: true, source: m ? m[1].trim() : null, raw: text };
}

function pluginInstalled() {
  const r = claude(['plugin', 'list']);
  if (r.status !== 0) return { installed: false, raw: r.stdout + r.stderr };
  const text = r.stdout;
  return { installed: text.includes(PLUGIN_ID), loaded: /vz-skills@vz-skills-marketplace[\s\S]{0,300}?Status:\s*\S*\s*loaded/.test(text), raw: text };
}

function cmdInstallFlat(argv) {
  const scope = parseScope(argv);
  const cv = requireClaude();
  log(`Claude Code ${cv}`);
  let manifest;
  try { manifest = flat.installFlat({ pluginRoot: PLUGIN_SRC, scope, projectDir: process.cwd(), version: version(), force: argv.includes('--force'), log }); }
  catch (e) { fail(e.message); }
  log('');
  log(`Done. Commands are unprefixed: /${manifest.skills.filter((s) => s !== 'vz-status').slice(0, 4).join(', /')}, ... and /vz-status (renamed so Claude Code's own /status stays available).`);
  log("Note: /review replaces Claude Code's bundled /review command in this scope. Uninstall with: npx vz-skills uninstall --flat" + (scope === 'user' ? '' : ` --scope ${scope}`));
  log('Start (or restart) Claude Code, then type / to see them. Run /vz-status to confirm.');
  if (scope === 'project') log('Project scope wrote .claude/skills, .claude/agents, .claude/vz-skills and hooks in .claude/settings.json using ${CLAUDE_PROJECT_DIR}; commit them to share with collaborators.');
  if (scope === 'local') log('Local scope: skills, agents and runtime are in .claude/ (shared if committed); hooks went to .claude/settings.local.json (personal).');
}

function cmdInstall(argv) {
  if (argv.includes('--flat')) return cmdInstallFlat(argv);
  const scope = parseScope(argv);
  const cv = requireClaude();
  log(`Claude Code ${cv}`);
  const dest = copyPlugin();
  log(`Copied plugin ${version()} to ${dest}`);
  const reg = marketplaceRegistered();
  if (!reg.listed) {
    const add = claude(['plugin', 'marketplace', 'add', MARKET_DIR]);
    if (add.status !== 0) {
      process.stderr.write(add.stdout + add.stderr);
      fail(`could not register the marketplace. If an older "${MARKETPLACE_NAME}" exists from a different path, run: claude plugin marketplace remove ${MARKETPLACE_NAME}  (this uninstalls its plugins), then retry.`);
    }
    log((add.stdout || '').trim() || `Registered marketplace ${MARKETPLACE_NAME}`);
  } else {
    const upd = claude(['plugin', 'marketplace', 'update', MARKETPLACE_NAME]);
    log(upd.status === 0 ? `Marketplace ${MARKETPLACE_NAME} already registered; listing refreshed` : `Marketplace ${MARKETPLACE_NAME} already registered (refresh reported: ${(upd.stderr || upd.stdout).trim().slice(0, 200)})`);
    if (reg.source && path.resolve(reg.source) !== path.resolve(MARKET_DIR)) log(`Note: it points at ${reg.source}, not ${MARKET_DIR}. Run "npx vz-skills uninstall --purge" and install again to switch.`);
  }
  const inst = claude(['plugin', 'install', PLUGIN_ID, '--scope', scope]);
  process.stdout.write(inst.stdout);
  if (inst.status !== 0) { process.stderr.write(inst.stderr); fail('plugin install failed (see output above)'); }
  log('');
  log('Done. Next:');
  log('  - Start (or restart) Claude Code in your project, or run /reload-plugins in an open session.');
  log('  - Type /vz-skills:status to see the active profile and a repository brief.');
  log('  - Optional: /vz-skills:setup BALANCED creates .vz-skills/config.json for the project.');
  if (scope === 'project') log('  - Scope "project" wrote .claude/settings.json; commit it so collaborators get the plugin (they run the same install once).');
}

function cmdUpdate(argv = []) {
  if (argv.includes('--flat')) return cmdInstallFlat([...argv, '--force']);
  requireClaude();
  copyPlugin();
  log(`Copied plugin ${version()} to ${MARKET_DIR}`);
  const u1 = claude(['plugin', 'marketplace', 'update', MARKETPLACE_NAME]);
  if (u1.status !== 0) { process.stderr.write(u1.stdout + u1.stderr); fail('marketplace update failed; run "npx vz-skills install" if it was never installed'); }
  const u2 = claude(['plugin', 'update', PLUGIN_ID]);
  process.stdout.write(u2.stdout + u2.stderr);
  if (u2.status !== 0) fail('plugin update failed');
  log('Updated. Restart Claude Code or run /reload-plugins to apply.');
}

function cmdUninstall(argv) {
  const scope = parseScope(argv);
  const purge = argv.includes('--purge');
  if (argv.includes('--flat')) {
    flat.uninstallFlat({ scope, projectDir: process.cwd(), log });
    log('Uninstalled the unprefixed skills. Project files (.vz-skills/config.json) were left untouched.');
    return;
  }
  requireClaude();
  const r = claude(['plugin', 'uninstall', PLUGIN_ID, '--scope', scope]);
  process.stdout.write(r.stdout + r.stderr);
  if (r.status !== 0 && !/not installed|not found/i.test(r.stdout + r.stderr)) fail('plugin uninstall failed');
  if (purge) {
    const m = claude(['plugin', 'marketplace', 'remove', MARKETPLACE_NAME]);
    process.stdout.write(m.stdout + m.stderr);
    fs.rmSync(MARKET_DIR, { recursive: true, force: true });
    log(`Removed ${MARKET_DIR}`);
  }
  log('Uninstalled. Project files (.vz-skills/config.json) were left untouched.');
}

function cmdTry(argv) {
  requireClaude();
  log(`Starting Claude Code with --plugin-dir ${PLUGIN_SRC} (session-only, nothing installed)`);
  const r = spawnSync('claude', ['--plugin-dir', PLUGIN_SRC, ...argv], { stdio: 'inherit', shell: IS_WIN });
  process.exit(r.status == null ? 1 : r.status);
}

function cmdDoctor() {
  let ok = true;
  const node = process.versions.node;
  const nodeOk = Number(node.split('.')[0]) >= 18;
  log(`${nodeOk ? 'ok  ' : 'FAIL'} Node.js ${node} (need >= 18)`); ok = ok && nodeOk;
  const cv = claude(['--version'], { timeout: 30000 });
  const claudeOk = !cv.error && cv.status === 0;
  log(`${claudeOk ? 'ok  ' : 'FAIL'} Claude Code ${claudeOk ? cv.stdout.trim() : 'not found on PATH'}`); ok = ok && claudeOk;
  log(`ok   Bundled plugin ${version()} at ${PLUGIN_SRC}`);
  if (claudeOk) {
    const reg = marketplaceRegistered();
    log(`${reg.listed ? 'ok  ' : 'info'} Marketplace ${MARKETPLACE_NAME} ${reg.listed ? `registered${reg.source ? ` (${reg.source})` : ''}` : 'not registered (run: npx vz-skills install)'}`);
    const inst = pluginInstalled();
    log(`${inst.installed ? 'ok  ' : 'info'} Plugin ${PLUGIN_ID} ${inst.installed ? (inst.loaded ? 'installed and loaded' : 'installed') : 'not installed'}`);
    log(`info Managed copy: ${fs.existsSync(MARKET_DIR) ? MARKET_DIR : '(none yet)'}`);
  }
  const fu = flat.flatStatus('user');
  log(`${fu.installed ? 'ok  ' : 'info'} Unprefixed (flat) user install: ${fu.installed ? `${fu.version} (${fu.skills} skills, ${fu.agents} agents) in ${fu.base}` : 'none (npx vz-skills install --flat)'}`);
  const fp = flat.flatStatus('project', process.cwd());
  if (fp.installed) log(`ok   Unprefixed (flat) project install: ${fp.version} in ${fp.base}`);
  const cfg = path.join(process.cwd(), '.vz-skills', 'config.json');
  if (fs.existsSync(cfg)) {
    const r = spawnSync(process.execPath, [path.join(PLUGIN_SRC, 'scripts', 'vz-config.js'), '--project', process.cwd(), '--no-user'], { encoding: 'utf8', windowsHide: true });
    log(`${r.status === 0 ? 'ok  ' : 'FAIL'} Project config ${cfg}${r.status === 0 ? '' : ' has errors:'}`);
    if (r.status !== 0) process.stdout.write(r.stdout.split('\n').filter((l) => /^(ERROR|WARNING)/.test(l)).map((l) => '     ' + l).join('\n') + '\n');
    ok = ok && r.status === 0;
  } else log('info No .vz-skills/config.json in the current directory (defaults: BALANCED profile). Create one with /vz-skills:setup.');
  process.exit(ok ? 0 : 1);
}

function cmdValidate() {
  requireClaude();
  const r = claude(['plugin', 'validate', PLUGIN_SRC, '--strict'], { inherit: true });
  process.exit(r.status == null ? 1 : r.status);
}

function help() {
  log(fs.readFileSync(__filename, 'utf8').split('\n').slice(3, 21).join('\n').replace(/^ \* ?/gm, ''));
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case 'install': return cmdInstall(rest);
    case 'update': return cmdUpdate(rest);
    case 'uninstall': return cmdUninstall(rest);
    case 'try': return cmdTry(rest);
    case 'doctor': return cmdDoctor(rest);
    case 'path': return log(PLUGIN_SRC);
    case 'validate': return cmdValidate(rest);
    case 'version': case '--version': case '-v': return log(version());
    case undefined: case 'help': case '--help': case '-h': return help();
    default: process.stderr.write(`vz-skills: unknown command "${cmd}"\n\n`); help(); process.exit(2);
  }
}

main();
