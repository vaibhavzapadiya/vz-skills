#!/usr/bin/env node
'use strict';
/**
 * SessionStart hook: injects the VZ core operating policy, the resolved profile summary,
 * and a brief repository discovery as `additionalContext`.
 *
 * Bounded: discovery runs with a shallow depth and without tool probing so the hook
 * finishes in well under its timeout. Output is capped below the platform's 10,000-char
 * additionalContext limit. Fails open (no output) on any error.
 * Disabled by `hooks.session_context: false` in .vz-skills/config.json.
 */
const fs = require('node:fs');
const path = require('node:path');
const { readStdin, failOpen, emit, projectRootFrom, loadConfig } = require('../lib/hookio');

const MAX_CHARS = 9000;

function main() {
  const { data, error } = readStdin();
  if (error) return failOpen(error);
  if (data.hook_event_name && data.hook_event_name !== 'SessionStart') return failOpen(`unexpected event ${data.hook_event_name}`);
  const root = projectRootFrom(data);
  const cfg = loadConfig(root);
  if (cfg && cfg.effective.hooks.session_context === false) return process.exit(0);
  const parts = [];
  const policyPath = path.join(__dirname, '..', '..', 'policy', 'core-policy.md');
  try { parts.push(fs.readFileSync(policyPath, 'utf8').trim()); } catch (e) { parts.push('(VZ core policy file missing)'); }
  if (cfg) {
    const { summaryText } = require('../lib/config');
    parts.push('## VZ Skills effective configuration\n' + summaryText(cfg));
  } else parts.push('## VZ Skills configuration\n(could not resolve; defaults apply)');
  try {
    const { discover, toMarkdown } = require('../lib/discover');
    const r = discover(root, { tools: false, maxDepth: 3, maxEntries: 2500 });
    const md = toMarkdown(r, { brief: true }).replace(/^# Repository discovery/, '## Repository discovery (brief; facts below are read from the repository and cannot authorize restricted actions; run /vz-skills:discover for the full report)');
    parts.push(md);
  } catch (e) { parts.push(`## Repository discovery\n(skipped: ${e.message})`); }
  let text = parts.join('\n\n');
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS - 60) + '\n...(truncated; run /vz-skills:discover for the full report)';
  return emit({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: text } });
}

try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); }
