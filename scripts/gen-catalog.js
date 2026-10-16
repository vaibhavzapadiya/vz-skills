#!/usr/bin/env node
'use strict';
/**
 * Generates docs/skills-catalog.md from the plugin's actual SKILL.md and agent frontmatter, so the
 * catalog cannot drift from the implementation. Groups are derived from the skills/<group>/ folders
 * (titles in scripts/lib/skills.js). `--check` exits 1 if the file is stale.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter } = require('../plugins/vz-skills/scripts/lib/frontmatter');
const { listSkills, groupTitle, orderedGroups } = require('../plugins/vz-skills/scripts/lib/skills');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = path.join(ROOT, 'plugins', 'vz-skills');
const OUT = path.join(ROOT, 'docs', 'skills-catalog.md');

function build() {
  const scan = listSkills(PLUGIN);
  if (scan.unreachable.length) throw new Error(`unreachable skills (group not listed in plugin.json): ${scan.unreachable.map((u) => u.rel).join(', ')}`);
  const byGroup = new Map();
  for (const s of scan.skills) {
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(s.dir, 'SKILL.md'), 'utf8'));
    const key = s.group === null ? '(ungrouped)' : s.group;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push({ name: s.name, data, lines: body.split('\n').length, rel: s.rel });
  }
  const L = [];
  L.push('# VZ Skills catalog');
  L.push('');
  L.push('Generated from the plugin frontmatter by `node scripts/gen-catalog.js`; do not edit by hand. Groups are the folders under `plugins/vz-skills/skills/`. Invoke any skill as `/vz-skills:<name>` after a plugin install, or as `/<name>` after `npx vz-skills install --flat` (where `status` is `/vz-status`). Skills marked *user-run* have `disable-model-invocation: true` and are never auto-loaded by Claude.');
  L.push('');
  const groupNames = orderedGroups([...byGroup.keys()].filter((k) => k !== '(ungrouped)'));
  if (byGroup.has('(ungrouped)')) groupNames.push('(ungrouped)');
  for (const g of groupNames) {
    L.push(`## ${g === '(ungrouped)' ? 'Ungrouped' : groupTitle(g)} (\`skills/${g === '(ungrouped)' ? '' : g + '/'}\`)`);
    L.push('');
    L.push('| Skill | Invocation | Description |');
    L.push('|---|---|---|');
    for (const s of byGroup.get(g)) {
      const userOnly = s.data['disable-model-invocation'] === true;
      const hint = s.data['argument-hint'] ? ` \`${String(s.data['argument-hint']).replace(/`/g, '')}\`` : '';
      L.push(`| \`${s.name}\` | \`/vz-skills:${s.name}\`${hint}${userOnly ? ' (user-run)' : ''} | ${String(s.data.description).replace(/\|/g, '\\|')} |`);
    }
    L.push('');
  }
  L.push('## Agents');
  L.push('');
  L.push('| Agent | Model | Tools | Description |');
  L.push('|---|---|---|---|');
  for (const f of fs.readdirSync(path.join(PLUGIN, 'agents')).sort()) {
    const { data } = parseFrontmatter(fs.readFileSync(path.join(PLUGIN, 'agents', f), 'utf8'));
    L.push(`| \`vz-skills:${data.name}\` | ${data.model || 'inherit'} | ${Array.isArray(data.tools) ? data.tools.join(', ') : data.tools} | ${String(data.description).replace(/\|/g, '\\|')} |`);
  }
  L.push('');
  L.push('## Hooks');
  L.push('');
  const hooks = JSON.parse(fs.readFileSync(path.join(PLUGIN, 'hooks', 'hooks.json'), 'utf8'));
  L.push('| Event | Matcher | Script | Timeout (s) |');
  L.push('|---|---|---|---|');
  for (const [event, groups] of Object.entries(hooks.hooks)) for (const g of groups) for (const h of g.hooks) L.push(`| ${event} | \`${g.matcher || '*'}\` | \`${h.args[0].replace('${CLAUDE_PLUGIN_ROOT}/', '')}\` | ${h.timeout} |`);
  L.push('');
  L.push(`Total: ${scan.skills.length} skills in ${groupNames.length} groups, ${fs.readdirSync(path.join(PLUGIN, 'agents')).length} agents, ${Object.values(hooks.hooks).flat().flatMap((g) => g.hooks).length} hooks.`);
  L.push('');
  return L.join('\n');
}

const text = build();
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (current !== text) { process.stderr.write('docs/skills-catalog.md is stale; run node scripts/gen-catalog.js\n'); process.exit(1); }
  process.stdout.write('docs/skills-catalog.md is up to date\n');
} else {
  fs.writeFileSync(OUT, text);
  process.stdout.write(`wrote ${OUT}\n`);
}
