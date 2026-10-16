#!/usr/bin/env node
'use strict';
/**
 * Generates docs/skills-catalog.md from the plugin's actual SKILL.md and agent frontmatter,
 * so the catalog cannot drift from the implementation. `--check` exits 1 if the file is stale.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter } = require('../plugins/vz-skills/scripts/lib/frontmatter');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN = path.join(ROOT, 'plugins', 'vz-skills');
const OUT = path.join(ROOT, 'docs', 'skills-catalog.md');

const GROUPS = {
  'User-run commands': ['setup', 'status', 'discover'],
  'Core lifecycle': ['using-vz-skills', 'clarify', 'plan', 'implement', 'test', 'debug', 'review', 'security-review', 'verify'],
  'Specialists': ['performance', 'frontend', 'backend', 'database', 'api-design', 'docs', 'release'],
};

function build() {
  const skillsDir = path.join(PLUGIN, 'skills');
  const skills = {};
  for (const d of fs.readdirSync(skillsDir)) {
    const { data, body } = parseFrontmatter(fs.readFileSync(path.join(skillsDir, d, 'SKILL.md'), 'utf8'));
    skills[d] = { data, lines: body.split('\n').length };
  }
  const listed = new Set(Object.values(GROUPS).flat());
  for (const s of Object.keys(skills)) if (!listed.has(s)) (GROUPS['Other'] = GROUPS['Other'] || []).push(s);
  const L = [];
  L.push('# VZ Skills catalog');
  L.push('');
  L.push('Generated from the plugin frontmatter by `node scripts/gen-catalog.js`; do not edit by hand. Invoke any skill as `/vz-skills:<name>`. Skills marked *user-run* have `disable-model-invocation: true` and are never auto-loaded by Claude.');
  L.push('');
  for (const [group, names] of Object.entries(GROUPS)) {
    L.push(`## ${group}`);
    L.push('');
    L.push('| Skill | Invocation | Description |');
    L.push('|---|---|---|');
    for (const n of names) {
      const s = skills[n];
      if (!s) continue;
      const userOnly = s.data['disable-model-invocation'] === true;
      const hint = s.data['argument-hint'] ? ` \`${String(s.data['argument-hint']).replace(/`/g, '')}\`` : '';
      L.push(`| \`${n}\` | \`/vz-skills:${n}\`${hint}${userOnly ? ' (user-run)' : ''} | ${String(s.data.description).replace(/\|/g, '\\|')} |`);
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
  L.push(`Total: ${Object.keys(skills).length} skills, ${fs.readdirSync(path.join(PLUGIN, 'agents')).length} agents, ${Object.values(hooks.hooks).flat().flatMap((g) => g.hooks).length} hooks.`);
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
