'use strict';
/**
 * Flat ("unprefixed") installation of VZ Skills.
 *
 * Claude Code namespaces every plugin skill as /<plugin>:<skill>. Skills placed in the personal
 * skills directory (~/.claude/skills) or a project's .claude/skills load as plain /<name>. This
 * module installs VZ Skills that way:
 *
 *   user scope    <config>/skills/<name>/SKILL.md, <config>/agents/<name>.md,
 *                 <config>/vz-skills/{scripts,policy,references}  (runtime), hooks merged into <config>/settings.json
 *                 where <config> = $CLAUDE_CONFIG_DIR or ~/.claude
 *   project scope <project>/.claude/skills, .claude/agents, .claude/vz-skills, hooks merged into .claude/settings.json
 *                 using ${CLAUDE_PROJECT_DIR} so the result is portable and committable
 *
 * Rewrites applied to skill, agent, and policy text when copying:
 *   ${CLAUDE_PLUGIN_ROOT}  -> runtime directory (absolute for user scope, ${CLAUDE_PROJECT_DIR}/.claude/vz-skills for project)
 *   /vz-skills:<name>      -> /<name>   (except status -> /vz-status, which would otherwise hide Claude Code's /status)
 *   vz-skills:<agent>      -> <agent>
 *
 * Uninstall removes exactly what install created (tracked in <runtime>/manifest.json) and only the hook
 * groups whose commands point into the runtime directory. settings.json is backed up before every write.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RENAMES = { status: 'vz-status' };
const HOOK_EVENTS_ORDER = ['PreToolUse', 'SessionStart'];

function configDir() {
  return process.env.CLAUDE_CONFIG_DIR ? path.resolve(process.env.CLAUDE_CONFIG_DIR) : path.join(os.homedir(), '.claude');
}

function targets(scope, projectDir) {
  if (scope === 'user') {
    const base = configDir();
    return { base, skills: path.join(base, 'skills'), agents: path.join(base, 'agents'), runtime: path.join(base, 'vz-skills'), settings: path.join(base, 'settings.json'), runtimeRef: null };
  }
  const base = path.join(path.resolve(projectDir), '.claude');
  return { base, skills: path.join(base, 'skills'), agents: path.join(base, 'agents'), runtime: path.join(base, 'vz-skills'), settings: path.join(base, scope === 'local' ? 'settings.local.json' : 'settings.json'), runtimeRef: '${CLAUDE_PROJECT_DIR}/.claude/vz-skills' };
}

function flatName(name) { return RENAMES[name] || name; }

function rewrite(text, runtimeRef) {
  return text
    .replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, runtimeRef)
    .replace(/\/vz-skills:([a-z-]+)/g, (m, n) => `/${flatName(n)}`)
    .replace(/@agent-vz-skills:([a-z-]+)/g, '@agent-$1')
    .replace(/\bvz-skills:(repo-analyst|independent-reviewer|security-reviewer)\b/g, '$1');
}

function readJson(file) {
  if (!fs.existsSync(file)) return {};
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  if (!text.trim()) return {};
  return JSON.parse(text);
}

function writeJsonWithBackup(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) fs.copyFileSync(file, `${file}.vz-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

function isOurHandler(h, runtimeMarkers) {
  const s = JSON.stringify(h || {});
  return runtimeMarkers.some((m) => s.includes(m));
}

function removeOurHooks(settings, runtimeMarkers) {
  if (!settings.hooks || typeof settings.hooks !== 'object') return settings;
  for (const event of Object.keys(settings.hooks)) {
    const groups = Array.isArray(settings.hooks[event]) ? settings.hooks[event] : [];
    const kept = groups.filter((g) => !(Array.isArray(g.hooks) && g.hooks.length && g.hooks.every((h) => isOurHandler(h, runtimeMarkers))));
    if (kept.length) settings.hooks[event] = kept; else delete settings.hooks[event];
  }
  if (!Object.keys(settings.hooks).length) delete settings.hooks;
  return settings;
}

function buildHooks(pluginRoot, runtimeRef) {
  const src = JSON.parse(fs.readFileSync(path.join(pluginRoot, 'hooks', 'hooks.json'), 'utf8')).hooks;
  const out = {};
  for (const event of Object.keys(src)) {
    out[event] = src[event].map((g) => ({ matcher: g.matcher, hooks: g.hooks.map((h) => Object.assign({}, h, { args: (h.args || []).map((a) => a.replace(/\$\{CLAUDE_PLUGIN_ROOT\}/g, runtimeRef)) })) }));
  }
  return out;
}

/**
 * @param {object} o { pluginRoot, scope: 'user'|'project'|'local', projectDir, version, log }
 */
function installFlat(o) {
  const t = targets(o.scope, o.projectDir || process.cwd());
  const runtimeRef = t.runtimeRef || t.runtime.replace(/\\/g, '/');
  const log = o.log || (() => {});
  // runtime
  fs.rmSync(t.runtime, { recursive: true, force: true });
  fs.mkdirSync(t.runtime, { recursive: true });
  for (const d of ['scripts', 'references']) fs.cpSync(path.join(o.pluginRoot, d), path.join(t.runtime, d), { recursive: true });
  fs.mkdirSync(path.join(t.runtime, 'policy'), { recursive: true });
  fs.writeFileSync(path.join(t.runtime, 'policy', 'core-policy.md'), rewrite(fs.readFileSync(path.join(o.pluginRoot, 'policy', 'core-policy.md'), 'utf8'), runtimeRef));
  fs.copyFileSync(path.join(o.pluginRoot, 'LICENSE'), path.join(t.runtime, 'LICENSE'));
  // references may mention skill names
  for (const f of fs.readdirSync(path.join(t.runtime, 'references'))) {
    const p = path.join(t.runtime, 'references', f);
    fs.writeFileSync(p, rewrite(fs.readFileSync(p, 'utf8'), runtimeRef));
  }
  // skills
  const skillsSrc = path.join(o.pluginRoot, 'skills');
  const installedSkills = [];
  const collisions = [];
  for (const name of fs.readdirSync(skillsSrc)) {
    const dest = path.join(t.skills, flatName(name));
    if (fs.existsSync(dest) && !fs.existsSync(path.join(dest, '.vz-skills-managed'))) collisions.push(flatName(name));
  }
  if (collisions.length && !o.force) {
    throw new Error(`these skills already exist in ${t.skills} and were not created by vz-skills: ${collisions.join(', ')}. Re-run with --force to replace them, or remove them first.`);
  }
  for (const name of fs.readdirSync(skillsSrc)) {
    const target = flatName(name);
    const dest = path.join(t.skills, target);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(path.join(skillsSrc, name), dest, { recursive: true });
    let text = fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8');
    text = rewrite(text, runtimeRef);
    if (target !== name) text = text.replace(/^name:\s*.*$/m, `name: ${target}`);
    fs.writeFileSync(path.join(dest, 'SKILL.md'), text);
    fs.writeFileSync(path.join(dest, '.vz-skills-managed'), `installed by vz-skills ${o.version}\n`);
    installedSkills.push(target);
  }
  // agents
  fs.mkdirSync(t.agents, { recursive: true });
  const installedAgents = [];
  for (const f of fs.readdirSync(path.join(o.pluginRoot, 'agents'))) {
    const dest = path.join(t.agents, f);
    fs.writeFileSync(dest, rewrite(fs.readFileSync(path.join(o.pluginRoot, 'agents', f), 'utf8'), runtimeRef));
    installedAgents.push(f);
  }
  // hooks
  const markers = [runtimeRef, t.runtime.replace(/\\/g, '/'), t.runtime];
  const settings = removeOurHooks(readJson(t.settings), markers);
  const ours = buildHooks(o.pluginRoot, runtimeRef);
  settings.hooks = settings.hooks || {};
  for (const event of HOOK_EVENTS_ORDER) if (ours[event]) settings.hooks[event] = [...(settings.hooks[event] || []), ...ours[event]];
  writeJsonWithBackup(t.settings, settings);
  // manifest for uninstall
  const manifest = { version: o.version, scope: o.scope, installed_at: new Date().toISOString(), skills: installedSkills, agents: installedAgents, settings: t.settings, runtimeRef };
  fs.writeFileSync(path.join(t.runtime, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  log(`Installed ${installedSkills.length} skills into ${t.skills}`);
  log(`Installed ${installedAgents.length} agents into ${t.agents}`);
  log(`Runtime (scripts, policy, references) at ${t.runtime}`);
  log(`Hooks merged into ${t.settings} (backup written beside it)`);
  return manifest;
}

function uninstallFlat(o) {
  const t = targets(o.scope, o.projectDir || process.cwd());
  const log = o.log || (() => {});
  const manifestPath = path.join(t.runtime, 'manifest.json');
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { /* fall back to scanning */ }
  const skillNames = manifest ? manifest.skills : fs.existsSync(t.skills) ? fs.readdirSync(t.skills).filter((n) => fs.existsSync(path.join(t.skills, n, '.vz-skills-managed'))) : [];
  let removed = 0;
  for (const n of skillNames) {
    const dir = path.join(t.skills, n);
    if (fs.existsSync(path.join(dir, '.vz-skills-managed'))) { fs.rmSync(dir, { recursive: true, force: true }); removed++; }
  }
  const agentNames = manifest ? manifest.agents : ['repo-analyst.md', 'independent-reviewer.md', 'security-reviewer.md'];
  let removedAgents = 0;
  for (const f of agentNames) {
    const p = path.join(t.agents, f);
    if (fs.existsSync(p) && /VZ Skills plugin/.test(fs.readFileSync(p, 'utf8'))) { fs.rmSync(p, { force: true }); removedAgents++; }
  }
  const runtimeRef = (manifest && manifest.runtimeRef) || t.runtimeRef || t.runtime.replace(/\\/g, '/');
  const markers = [runtimeRef, t.runtime.replace(/\\/g, '/'), t.runtime];
  if (fs.existsSync(t.settings)) {
    const settings = readJson(t.settings);
    const before = JSON.stringify(settings);
    removeOurHooks(settings, markers);
    if (JSON.stringify(settings) !== before) writeJsonWithBackup(t.settings, settings);
  }
  fs.rmSync(t.runtime, { recursive: true, force: true });
  for (const d of [t.skills, t.agents]) { try { if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmdirSync(d); } catch { /* leave it */ } }
  log(`Removed ${removed} skills, ${removedAgents} agents, the runtime directory, and VZ hook entries from ${t.settings} (settings backups are kept beside it)`);
  return { removed, removedAgents };
}

function flatStatus(scope, projectDir) {
  const t = targets(scope, projectDir || process.cwd());
  const manifestPath = path.join(t.runtime, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return { installed: false, base: t.base };
  try { const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); return { installed: true, base: t.base, version: m.version, skills: m.skills.length, agents: m.agents.length }; } catch { return { installed: true, base: t.base, version: 'unknown' }; }
}

module.exports = { installFlat, uninstallFlat, flatStatus, rewrite, targets, RENAMES };
