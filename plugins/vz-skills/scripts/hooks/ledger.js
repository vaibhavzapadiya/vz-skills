#!/usr/bin/env node
'use strict';
/**
 * PostToolUse / PostToolUseFailure hook: append one line to the project's activity ledger for every
 * file edit (Write, Edit, MultiEdit, NotebookEdit) and shell command (Bash, PowerShell).
 *
 * The ledger is the record /vz-skills:ledger, the dashboard, and the claim check read. It is stored
 * outside the repository (see scripts/lib/ledger.js). Commands are truncated and redacted.
 * Silent: never prints a decision. Fails open. Turn off with hooks.ledger: false.
 */
const { readStdin, failOpen, projectRootFrom, loadConfig, relativeToRoot } = require('../lib/hookio');
const ledger = require('../lib/ledger');

const EDIT_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const SHELL_TOOLS = new Set(['Bash', 'PowerShell']);

function main() {
  const { data, error } = readStdin();
  if (error) return failOpen(error);
  const event = data.hook_event_name;
  if (event && event !== 'PostToolUse' && event !== 'PostToolUseFailure') return failOpen(`unexpected event ${event}`);
  const tool = data.tool_name;
  if (!EDIT_TOOLS.has(tool) && !SHELL_TOOLS.has(tool)) return process.exit(0);
  const root = ledger.projectOf(projectRootFrom(data)); // the project, even after `cd src`
  const cfg = loadConfig(root);
  if (cfg && cfg.effective.hooks.ledger === false) return process.exit(0);

  const ti = data.tool_input || {};
  const ok = event !== 'PostToolUseFailure';
  const base = { session: data.session_id || null, tool, ok };
  if (EDIT_TOOLS.has(tool)) {
    const file = typeof ti.file_path === 'string' ? ti.file_path : typeof ti.notebook_path === 'string' ? ti.notebook_path : null;
    if (!file) return process.exit(0);
    const { rel, outside } = relativeToRoot(root, file);
    ledger.append(root, Object.assign(base, { kind: 'edit', file: outside ? file : rel }));
  } else {
    if (typeof ti.command !== 'string') return process.exit(0);
    ledger.append(root, Object.assign(base, { kind: 'command', command: ti.command, check: ledger.isCheckCommand(ti.command) }));
  }
  process.exit(0);
}

try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); }
