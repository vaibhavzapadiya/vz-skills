'use strict';
/**
 * Skill discovery that mirrors Claude Code's scan rules (plugin manifest reference, accessed 2026-10-16):
 *   - the default `skills/` directory is scanned for `<name>/SKILL.md`;
 *   - each directory listed in the manifest `skills` key is scanned the same way, or is itself a skill
 *     when it holds SKILL.md directly;
 *   - a directory under `skills/` that has no SKILL.md is a *group*; its skills load only if that group
 *     directory is listed in the manifest. Otherwise they are silently absent at runtime, which
 *     `claude plugin validate` does not report (observed on 2.1.259). `unreachable` makes that visible.
 */
const fs = require('node:fs');
const path = require('node:path');

const GROUP_TITLES = { entry: 'Entry points', lifecycle: 'Lifecycle', specialists: 'Specialists', productivity: 'Productivity' };
const GROUP_ORDER = ['entry', 'lifecycle', 'specialists', 'productivity'];

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function hasSkillFile(dir) { return fs.existsSync(path.join(dir, 'SKILL.md')); }
function norm(rel) { return rel.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, ''); }

function manifestSkillDirs(pluginRoot) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(pluginRoot, '.claude-plugin', 'plugin.json'), 'utf8'));
    const v = m.skills;
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).filter((x) => typeof x === 'string').map(norm);
  } catch { return []; }
}

/**
 * @returns {{ skills: Array<{name:string, dir:string, rel:string, group:string|null}>,
 *             groups: Array<{name:string, dir:string, rel:string, listed:boolean, count:number}>,
 *             unreachable: Array<{name:string, rel:string, reason:string}>,
 *             manifestDirs: string[] }}
 */
function listSkills(pluginRoot) {
  const listed = new Set(manifestSkillDirs(pluginRoot));
  const skills = [];
  const groups = [];
  const unreachable = [];
  const seen = new Set();
  const add = (name, dir, group) => {
    if (seen.has(dir)) return;
    seen.add(dir);
    skills.push({ name, dir, rel: norm(path.relative(pluginRoot, dir)), group });
  };
  const skillsRoot = path.join(pluginRoot, 'skills');
  if (isDir(skillsRoot)) {
    for (const ent of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const dir = path.join(skillsRoot, ent.name);
      if (hasSkillFile(dir)) { add(ent.name, dir, null); continue; }
      const rel = `skills/${ent.name}`;
      const children = fs.readdirSync(dir, { withFileTypes: true }).filter((c) => c.isDirectory() && hasSkillFile(path.join(dir, c.name)));
      const isListed = listed.has(rel);
      groups.push({ name: ent.name, dir, rel, listed: isListed, count: children.length });
      for (const c of children) {
        if (isListed) add(c.name, path.join(dir, c.name), ent.name);
        else unreachable.push({ name: c.name, rel: `${rel}/${c.name}`, reason: `group directory ./${rel} is not listed in plugin.json "skills"` });
      }
    }
  }
  for (const rel of listed) {
    const dir = path.join(pluginRoot, rel);
    if (!isDir(dir)) continue;
    if (hasSkillFile(dir)) { add(path.basename(dir), dir, null); continue; }
    if (rel.startsWith('skills/')) continue; // handled above
    for (const c of fs.readdirSync(dir, { withFileTypes: true })) if (c.isDirectory() && hasSkillFile(path.join(dir, c.name))) add(c.name, path.join(dir, c.name), path.basename(dir));
  }
  skills.sort((a, b) => a.name.localeCompare(b.name));
  return { skills, groups, unreachable, manifestDirs: [...listed] };
}

function groupTitle(name) {
  if (name === null) return 'Ungrouped';
  return GROUP_TITLES[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function orderedGroups(names) {
  const known = GROUP_ORDER.filter((g) => names.includes(g));
  const rest = names.filter((g) => !GROUP_ORDER.includes(g)).sort();
  return [...known, ...rest];
}

module.exports = { listSkills, manifestSkillDirs, groupTitle, orderedGroups, GROUP_TITLES, GROUP_ORDER };
