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
 * groups whose commands point into the runtime directory. settings.json is backed up before every write
 * (the last three backups are kept).
 *
 * Every check (name collisions, a readable settings file) runs before anything is written, so a failed
 * install or uninstall leaves the previous state intact. Same-named skills or agents that vz-skills did
 * not create are never replaced without --force, and with --force they are first copied to
 * <base>/vz-skills-backups/<timestamp>/.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RENAMES = { status: 'vz-status' };
const KEEP_BACKUPS = 3;
// Every shipped agent says this in its body; it identifies agent files vz-skills wrote.
const AGENT_SIGNATURE = /VZ Skills plugin/;

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
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  if (!text.trim()) return {};
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`${file} is not valid JSON (${e.message}). Fix it by hand; nothing was changed.`); }
}

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

function writeJsonWithBackup(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, `${file}.vz-backup-${stamp()}`);
    const prefix = `${path.basename(file)}.vz-backup-`;
    const old = fs.readdirSync(path.dirname(file)).filter((n) => n.startsWith(prefix)).sort();
    for (const n of old.slice(0, Math.max(0, old.length - KEEP_BACKUPS))) fs.rmSync(path.join(path.dirname(file), n), { force: true });
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

/** Markers that identify our hook handlers: the runtime directory followed by a separator. */
function hookMarkers(runtimeRef, runtime) {
  return [...new Set([runtimeRef, runtime.replace(/\\/g, '/')])].map((m) => m.replace(/\/+$/, '') + '/');
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

  // 1. Checks first: nothing is written until all of them pass.
  const { listSkills } = require(path.join(o.pluginRoot, 'scripts', 'lib', 'skills.js'));
  const scan = listSkills(o.pluginRoot);
  if (scan.unreachable.length) throw new Error(`plugin has skills that would not load (group not listed in plugin.json): ${scan.unreachable.map((u) => u.rel).join(', ')}`);
  const agentFiles = fs.readdirSync(path.join(o.pluginRoot, 'agents')).filter((f) => f.endsWith('.md'));
  const skillCollisions = scan.skills.map((sk) => flatName(sk.name)).filter((n) => fs.existsSync(path.join(t.skills, n)) && !fs.existsSync(path.join(t.skills, n, '.vz-skills-managed')));
  const agentCollisions = agentFiles.filter((f) => fs.existsSync(path.join(t.agents, f)) && !AGENT_SIGNATURE.test(fs.readFileSync(path.join(t.agents, f), 'utf8')));
  if ((skillCollisions.length || agentCollisions.length) && !o.force) {
    const parts = [];
    if (skillCollisions.length) parts.push(`skills in ${t.skills}: ${skillCollisions.join(', ')}`);
    if (agentCollisions.length) parts.push(`agents in ${t.agents}: ${agentCollisions.join(', ')}`);
    throw new Error(`these already exist and were not created by vz-skills (${parts.join('; ')}). Nothing was changed. Remove or rename them, or re-run with --force to replace them (they are backed up to ${path.join(t.base, 'vz-skills-backups')} first).`);
  }
  const existingSettings = readJson(t.settings); // throws with the file name if it is malformed

  // 2. Back up anything --force is about to replace.
  if (skillCollisions.length || agentCollisions.length) {
    const dir = path.join(t.base, 'vz-skills-backups', stamp());
    for (const n of skillCollisions) fs.cpSync(path.join(t.skills, n), path.join(dir, 'skills', n), { recursive: true });
    for (const f of agentCollisions) { fs.mkdirSync(path.join(dir, 'agents'), { recursive: true }); fs.copyFileSync(path.join(t.agents, f), path.join(dir, 'agents', f)); }
    log(`Backed up ${skillCollisions.length + agentCollisions.length} replaced item(s) to ${dir}`);
  }

  // 3. Runtime
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
  // 4. Skills (grouped folders in the plugin flatten to <skills>/<name>; Claude Code does not nest skill names)
  const installedSkills = [];
  for (const s of scan.skills) {
    const name = s.name;
    const target = flatName(name);
    const dest = path.join(t.skills, target);
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(s.dir, dest, { recursive: true });
    let text = fs.readFileSync(path.join(dest, 'SKILL.md'), 'utf8');
    text = rewrite(text, runtimeRef);
    if (target !== name) text = text.replace(/^name:\s*.*$/m, `name: ${target}`);
    fs.writeFileSync(path.join(dest, 'SKILL.md'), text);
    fs.writeFileSync(path.join(dest, '.vz-skills-managed'), `installed by vz-skills ${o.version}\n`);
    installedSkills.push(target);
  }
  // 5. Agents
  fs.mkdirSync(t.agents, { recursive: true });
  const installedAgents = [];
  for (const f of agentFiles) {
    const dest = path.join(t.agents, f);
    fs.writeFileSync(dest, rewrite(fs.readFileSync(path.join(o.pluginRoot, 'agents', f), 'utf8'), runtimeRef));
    installedAgents.push(f);
  }
  // 6. Hooks
  const settings = removeOurHooks(existingSettings, hookMarkers(runtimeRef, t.runtime));
  const ours = buildHooks(o.pluginRoot, runtimeRef);
  settings.hooks = settings.hooks || {};
  for (const event of Object.keys(ours)) settings.hooks[event] = [...(settings.hooks[event] || []), ...ours[event]];
  writeJsonWithBackup(t.settings, settings);
  // manifest for uninstall
  const manifest = { version: o.version, scope: o.scope, installed_at: new Date().toISOString(), skills: installedSkills, agents: installedAgents, settings: t.settings, runtimeRef };
  fs.writeFileSync(path.join(t.runtime, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  log(`${o.updating ? 'Updated' : 'Installed'} ${installedSkills.length} skills in ${t.skills}`);
  log(`${o.updating ? 'Updated' : 'Installed'} ${installedAgents.length} agents in ${t.agents}`);
  log(`Runtime (scripts, policy, references) at ${t.runtime}`);
  log(`Hooks merged into ${t.settings} (backup written beside it; the last ${KEEP_BACKUPS} are kept)`);
  return manifest;
}

function uninstallFlat(o) {
  const t = targets(o.scope, o.projectDir || process.cwd());
  const log = o.log || (() => {});
  const manifestPath = path.join(t.runtime, 'manifest.json');
  let manifest = null;
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { /* fall back to scanning */ }
  // A project and a local flat install share .claude/ but keep hooks in different settings files;
  // uninstalling with the wrong scope would delete the files and strand the hooks.
  if (manifest && ((manifest.scope && manifest.scope !== o.scope) || (manifest.settings && path.resolve(manifest.settings) !== path.resolve(t.settings)))) {
    throw new Error(`the flat install here was made with --scope ${manifest.scope} (hooks in ${manifest.settings}); run uninstall --flat --scope ${manifest.scope}. Nothing was changed.`);
  }
  const settings = fs.existsSync(t.settings) ? readJson(t.settings) : null; // throws before anything is deleted
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
  let removedHooks = false;
  if (settings) {
    const before = JSON.stringify(settings);
    removeOurHooks(settings, hookMarkers(runtimeRef, t.runtime));
    if (JSON.stringify(settings) !== before) { writeJsonWithBackup(t.settings, settings); removedHooks = true; }
  }
  const hadRuntime = fs.existsSync(t.runtime);
  fs.rmSync(t.runtime, { recursive: true, force: true });
  for (const d of [t.skills, t.agents]) { try { if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmdirSync(d); } catch { /* leave it */ } }
  const removedAnything = removed > 0 || removedAgents > 0 || removedHooks || hadRuntime;
  if (removedAnything) log(`Removed ${removed} skills, ${removedAgents} agents, ${hadRuntime ? 'the runtime directory' : 'no runtime directory'}, and ${removedHooks ? 'VZ hook entries from ' + t.settings : 'no hook entries'} (settings backups are kept beside it)`);
  return { removed, removedAgents, removedHooks, removedAnything };
}

function flatStatus(scope, projectDir) {
  const t = targets(scope, projectDir || process.cwd());
  const manifestPath = path.join(t.runtime, 'manifest.json');
  if (!fs.existsSync(manifestPath)) return { installed: false, base: t.base };
  // project and local installs share <project>/.claude/vz-skills, so the manifest's scope decides which one it is
  try {
    const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (m.scope && m.scope !== scope) return { installed: false, base: t.base, otherScope: m.scope };
    return { installed: true, base: t.base, version: m.version, skills: m.skills.length, agents: m.agents.length };
  } catch { return { installed: true, base: t.base, version: 'unknown' }; }
}

module.exports = { installFlat, uninstallFlat, flatStatus, rewrite, targets, RENAMES };
