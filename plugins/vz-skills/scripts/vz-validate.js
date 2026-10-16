#!/usr/bin/env node
'use strict';
/**
 * vz-validate: structural validation for the VZ Skills plugin.
 *
 * Checks the plugin manifest, every SKILL.md, every agent file, and
 * hooks/hooks.json against the conventions in the official Claude Code docs
 * (plugins/manifest-reference, skills, sub-agents, hooks pages; accessed 2026-10-16). It is stricter than `claude plugin validate`
 * in places (naming, description length, line counts) and complementary to it: run both.
 *
 * Usage: node vz-validate.js [pluginRoot] [--json]
 * Exit codes: 0 ok (warnings allowed), 1 errors found, 2 usage/unexpected error.
 */
const fs = require('node:fs');
const path = require('node:path');
const { parseFrontmatter } = require('./lib/frontmatter');

// Skill frontmatter fields documented at https://code.claude.com/docs/en/skills (2026-10-16)
const SKILL_FIELDS = new Set(['name', 'description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell', 'metadata', 'license', 'compatibility']);
// Agent fields honoured for plugin agents at https://code.claude.com/docs/en/plugins/components#agents (2026-10-16)
const AGENT_FIELDS = new Set(['name', 'description', 'model', 'effort', 'maxTurns', 'autoCompactWindow', 'tools', 'disallowedTools', 'skills', 'memory', 'background', 'omitClaudeMd', 'isolation', 'color', 'experimental']);
const AGENT_IGNORED_IN_PLUGINS = new Set(['permissionMode', 'hooks', 'mcpServers', 'initialPrompt']);
const HOOK_EVENTS = new Set(['SessionStart', 'Setup', 'UserPromptSubmit', 'UserPromptExpansion', 'PreToolUse', 'PermissionRequest', 'PermissionDenied', 'PostToolUse', 'PostToolUseFailure', 'PostToolBatch', 'Notification', 'MessageDisplay', 'SubagentStart', 'SubagentStop', 'TaskCreated', 'TaskCompleted', 'Stop', 'StopFailure', 'TeammateIdle', 'InstructionsLoaded', 'ConfigChange', 'CwdChanged', 'DirectoryAdded', 'FileChanged', 'WorktreeCreate', 'WorktreeRemove', 'PreCompact', 'PostCompact', 'PreModelSwitch', 'PostModelSwitch', 'Elicitation', 'ElicitationResult', 'SessionEnd']);
const HOOK_HANDLER_FIELDS = new Set(['type', 'command', 'args', 'timeout', 'shell', 'onFailure', 'if', 'statusMessage', 'once', 'async', 'asyncRewake', 'url', 'server', 'tool', 'input', 'prompt', 'model', 'headers']);
const MODELS = new Set(['sonnet', 'opus', 'haiku', 'fable', 'inherit']);
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validatePlugin(root) {
  const errors = [];
  const warnings = [];
  const info = { skills: [], agents: [], hooks: null, manifest: null };
  const err = (f, m) => errors.push({ file: f, message: m });
  const warn = (f, m) => warnings.push({ file: f, message: m });

  // manifest
  const manifestPath = path.join(root, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) err('.claude-plugin/plugin.json', 'manifest missing');
  else {
    try {
      const m = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      info.manifest = m;
      if (!m.name) err(manifestPath, 'manifest.name is required');
      else if (!NAME_RE.test(m.name)) err(manifestPath, `manifest.name "${m.name}" must be kebab-case`);
      else if (/^(claude|anthropic|anthropics|cc-plugin)-/.test(m.name)) err(manifestPath, 'manifest.name uses a reserved prefix');
      for (const f of ['version', 'description']) if (!m[f]) warn(manifestPath, `manifest.${f} missing (claude plugin validate warns on this)`);
      if (!m.author || !m.author.name) warn(manifestPath, 'manifest.author.name missing');
      const known = new Set(['$schema', 'name', 'displayName', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords', 'metadata', 'icon', 'documentationUrl', 'supportUrl', 'privacyPolicyUrl', 'termsOfServiceUrl', 'defaultEnabled', 'dependencies', 'settings', 'userConfig', 'types', 'channels', 'skills', 'commands', 'agents', 'hooks', 'mcpServers', 'lspServers', 'outputStyles', 'workflows', 'experimental']);
      for (const k of Object.keys(m)) if (!known.has(k)) warn(manifestPath, `unknown manifest field "${k}" (Claude Code strips it)`);
      for (const k of ['skills', 'commands', 'agents', 'hooks', 'outputStyles', 'workflows']) {
        const v = m[k];
        const paths = typeof v === 'string' ? [v] : Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
        for (const p of paths) {
          if (!(p === '.' || p.startsWith('./'))) err(manifestPath, `manifest.${k} path "${p}" must start with ./`);
          if (p.includes('..')) err(manifestPath, `manifest.${k} path "${p}" contains ..`);
          if (!fs.existsSync(path.join(root, p))) err(manifestPath, `manifest.${k} path "${p}" does not exist`);
        }
      }
    } catch (e) { err(manifestPath, `manifest unparsable: ${e.message}`); }
  }
  if (fs.existsSync(path.join(root, 'CLAUDE.md'))) warn('CLAUDE.md', 'a CLAUDE.md at the plugin root is not loaded by Claude Code');
  if (fs.existsSync(path.join(root, 'commands'))) warn('commands/', 'legacy commands/ directory present; docs recommend skills/ for new plugins');

  // skills (mirrors the platform scan: skills/<name>/SKILL.md plus every directory listed in manifest "skills")
  const { listSkills } = require('./lib/skills');
  const scan = listSkills(root);
  for (const u of scan.unreachable) err(u.rel, `skill would not load: ${u.reason}`);
  for (const g of scan.groups) if (g.count === 0) warn(g.rel, 'group directory contains no skills');
  const names = new Map();
  if (scan.skills.length === 0 && scan.unreachable.length === 0) warn('skills/', 'no skills found');
  {
    for (const s of scan.skills) {
      const ent = { name: s.name };
      const file = path.join(s.dir, 'SKILL.md');
      const rel = `${s.rel}/SKILL.md`;
      const text = fs.readFileSync(file, 'utf8');
      const { data, body, warnings: fmWarn, hasFrontmatter } = parseFrontmatter(text);
      if (!hasFrontmatter) { err(rel, 'frontmatter missing or malformed (must start with --- on line 1)'); continue; }
      for (const w of fmWarn) warn(rel, `frontmatter: ${w}`);
      if (!NAME_RE.test(ent.name) || ent.name.length > 64) err(rel, `directory name "${ent.name}" must be lowercase kebab-case <= 64 chars`);
      if (data.name !== undefined && data.name !== ent.name) err(rel, `frontmatter name "${data.name}" differs from directory name "${ent.name}"`);
      if (ent.name === 'synced' || ent.name.startsWith('anthropic-skills')) err(rel, 'reserved skill name');
      if (typeof data.description !== 'string' || data.description.trim().length < 20) err(rel, 'description missing or too short (< 20 chars); Claude uses it to decide when to load the skill');
      const listing = `${data.description || ''}${data.when_to_use || ''}`;
      if (listing.length > 1536) err(rel, `description + when_to_use is ${listing.length} chars; the listing truncates at 1536`);
      if (listing.length > 600) warn(rel, `description + when_to_use is ${listing.length} chars; keep descriptions tight to protect the listing budget`);
      for (const k of Object.keys(data)) if (!SKILL_FIELDS.has(k)) err(rel, `unsupported frontmatter field "${k}" (Claude Code ignores unknown fields silently)`);
      for (const k of ['disable-model-invocation', 'user-invocable', 'background']) if (data[k] !== undefined && typeof data[k] !== 'boolean') err(rel, `${k} must be boolean`);
      if (data.model !== undefined && !MODELS.has(String(data.model)) && !/^claude-/.test(String(data.model))) warn(rel, `model "${data.model}" is not a known alias`);
      if (data.context !== undefined && data.context !== 'fork') err(rel, 'context must be "fork" when set');
      if (data.agent !== undefined && data.context !== 'fork') warn(rel, 'agent is only used with context: fork');
      if (data.effort !== undefined && !['low', 'medium', 'high', 'xhigh', 'max'].includes(String(data.effort))) err(rel, `effort "${data.effort}" invalid`);
      const lineCount = text.split(/\r?\n/).length;
      if (lineCount > 500) err(rel, `SKILL.md has ${lineCount} lines; keep under 500 and move detail to supporting files`);
      if (body.trim().length < 200) err(rel, 'skill body is too short to be a real workflow');
      if (!/#{1,3}\s/.test(body)) warn(rel, 'skill body has no headings');
      for (const m of body.matchAll(/\]\((?!https?:|#|mailto:)([^)\s]+)\)/g)) {
        const target = m[1].split('#')[0];
        if (!target) continue;
        const abs = path.resolve(path.dirname(file), target);
        if (!fs.existsSync(abs)) warn(rel, `relative link target not found: ${target}`);
      }
      if (/\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/[^\s"'`)]+/.test(body)) {
        for (const m of body.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/(scripts\/[A-Za-z0-9_./-]+)/g)) {
          if (!fs.existsSync(path.join(root, m[1]))) err(rel, `references missing script ${m[1]}`);
        }
      }
      if (names.has(ent.name)) err(rel, 'duplicate skill name');
      names.set(ent.name, rel);
      info.skills.push({ name: ent.name, group: s.group, description: data.description, userInvocableOnly: data['disable-model-invocation'] === true, hidden: data['user-invocable'] === false, lines: lineCount });
    }
  }

  // agents
  const agentsDir = path.join(root, 'agents');
  if (fs.existsSync(agentsDir)) {
    const walkAgents = (dir, relDir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const rel = `${relDir}/${ent.name}`;
        if (ent.isDirectory()) { walkAgents(path.join(dir, ent.name), rel); continue; }
        if (!ent.name.endsWith('.md')) { warn(rel, 'non-markdown file in agents/'); continue; }
        const text = fs.readFileSync(path.join(dir, ent.name), 'utf8');
        const { data, body, warnings: fmWarn, hasFrontmatter } = parseFrontmatter(text);
        if (!hasFrontmatter) { err(rel, 'frontmatter missing or malformed; the agent would load with every field ignored'); continue; }
        for (const w of fmWarn) warn(rel, `frontmatter: ${w}`);
        if (!data.name) err(rel, 'name is required');
        else if (String(data.name).includes(':') || String(data.name).startsWith('-')) err(rel, 'name must not contain ":" or start with "-"');
        else if (data.name !== ent.name.replace(/\.md$/, '')) warn(rel, `name "${data.name}" differs from file name`);
        if (!data.description) err(rel, 'description is required');
        for (const k of Object.keys(data)) {
          if (AGENT_IGNORED_IN_PLUGINS.has(k)) err(rel, `field "${k}" is ignored for plugin agents; remove it`);
          else if (!AGENT_FIELDS.has(k)) err(rel, `unsupported agent field "${k}"`);
        }
        if (data.model !== undefined && !MODELS.has(String(data.model)) && !/^claude-/.test(String(data.model))) warn(rel, `model "${data.model}" is not a known alias`);
        if (data.isolation !== undefined && data.isolation !== 'worktree') err(rel, 'isolation must be "worktree" when set');
        if (body.trim().length < 200) err(rel, 'agent system prompt is too short');
        info.agents.push({ name: data.name, tools: data.tools, model: data.model });
      }
    };
    walkAgents(agentsDir, 'agents');
  }

  // hooks
  const hooksPath = path.join(root, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksPath)) {
    try {
      const h = JSON.parse(fs.readFileSync(hooksPath, 'utf8'));
      if (!h.hooks || typeof h.hooks !== 'object') err('hooks/hooks.json', 'file must wrap the event map in a top-level "hooks" key');
      else {
        for (const [event, groups] of Object.entries(h.hooks)) {
          if (!HOOK_EVENTS.has(event)) err('hooks/hooks.json', `unknown hook event "${event}"`);
          if (!Array.isArray(groups)) { err('hooks/hooks.json', `${event} must be an array of matcher groups`); continue; }
          groups.forEach((g, gi) => {
            if (!Array.isArray(g.hooks)) { err('hooks/hooks.json', `${event}[${gi}].hooks must be an array`); return; }
            for (const k of Object.keys(g)) if (!['matcher', 'hooks'].includes(k)) err('hooks/hooks.json', `${event}[${gi}] unknown group key "${k}"`);
            g.hooks.forEach((hk, hi) => {
              const where = `${event}[${gi}].hooks[${hi}]`;
              if (!['command', 'prompt', 'http', 'mcp_tool', 'agent'].includes(hk.type)) err('hooks/hooks.json', `${where} unsupported type "${hk.type}"`);
              for (const k of Object.keys(hk)) if (!HOOK_HANDLER_FIELDS.has(k)) err('hooks/hooks.json', `${where} unknown handler field "${k}"`);
              if (hk.type === 'command') {
                if (!hk.command) err('hooks/hooks.json', `${where} command missing`);
                if (hk.timeout !== undefined && (typeof hk.timeout !== 'number' || hk.timeout <= 0 || hk.timeout > 600)) err('hooks/hooks.json', `${where} timeout must be 1..600 seconds`);
                if (hk.timeout === undefined || hk.timeout > 60) warn('hooks/hooks.json', `${where} has no short timeout; VZ hooks should finish in seconds`);
                const refs = [hk.command, ...(hk.args || [])].filter((s) => typeof s === 'string');
                for (const s of refs) {
                  const m = s.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/(.+)$/);
                  if (m && !fs.existsSync(path.join(root, m[1]))) err('hooks/hooks.json', `${where} references missing file ${m[1]}`);
                  if (/\$\{CLAUDE_PLUGIN_ROOT\}/.test(s) && !hk.args && !/"\$\{CLAUDE_PLUGIN_ROOT\}/.test(s)) warn('hooks/hooks.json', `${where} shell-form command should quote \${CLAUDE_PLUGIN_ROOT}`);
                }
              }
            });
          });
        }
        info.hooks = Object.keys(h.hooks);
      }
    } catch (e) { err('hooks/hooks.json', `unparsable: ${e.message}`); }
  }
  return { ok: errors.length === 0, errors, warnings, info };
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const root = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..'));
  if (!fs.existsSync(root)) { process.stderr.write(`vz-validate: no such directory ${root}\n`); process.exit(2); }
  const r = validatePlugin(root);
  if (json) process.stdout.write(JSON.stringify(r, null, 2) + '\n');
  else {
    for (const e of r.errors) process.stdout.write(`ERROR ${e.file}: ${e.message}\n`);
    for (const w of r.warnings) process.stdout.write(`WARN  ${w.file}: ${w.message}\n`);
    process.stdout.write(`${r.ok ? 'Validation passed' : 'Validation failed'}: ${r.errors.length} error(s), ${r.warnings.length} warning(s); ${r.info.skills.length} skill(s), ${r.info.agents.length} agent(s), hooks: ${r.info.hooks ? r.info.hooks.join(',') : 'none'}\n`);
  }
  process.exit(r.ok ? 0 : 1);
}

if (require.main === module) main();
module.exports = { validatePlugin, SKILL_FIELDS, AGENT_FIELDS, HOOK_EVENTS };
