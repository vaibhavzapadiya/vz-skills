#!/usr/bin/env node
'use strict';
/**
 * Show the activity ledger for a project: what Claude edited and ran, and which checks passed.
 *
 *   node vz-ledger.js [--project <dir>] [--session <id> | --last-session] [--limit <n>] [--format md|json] [--path]
 *
 * --last-session  only the most recent session (default: every session, newest last)
 * --limit         the last n entries (default 200)
 * --path          print where the ledger file is and exit
 * Exit codes: 0 ok (also when the ledger is empty), 2 usage error.
 */
const path = require('node:path');
const ledger = require('./lib/ledger');

function parse(argv) {
  const o = { project: process.cwd(), session: null, lastSession: false, limit: 200, format: 'md', path: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') o.project = argv[++i];
    else if (a === '--session') o.session = argv[++i];
    else if (a === '--last-session') o.lastSession = true;
    else if (a === '--limit') o.limit = Number(argv[++i]);
    else if (a === '--format') o.format = argv[++i];
    else if (a === '--path') o.path = true;
    else if (a === '-h' || a === '--help') { o.help = true; }
    else { process.stderr.write(`vz-ledger: unknown option ${a}\n`); process.exit(2); }
  }
  if (!['md', 'json'].includes(o.format) || !(o.limit > 0)) { process.stderr.write('vz-ledger: --format md|json, --limit must be a positive number\n'); process.exit(2); }
  return o;
}

function summarize(entries) {
  const files = new Set(entries.filter((e) => e.kind === 'edit').map((e) => e.file));
  const checks = entries.filter((e) => e.kind === 'command' && e.check);
  return {
    edits: entries.filter((e) => e.kind === 'edit').length,
    files: files.size,
    commands: entries.filter((e) => e.kind === 'command').length,
    checks_passed: checks.filter((e) => e.ok !== false).length,
    checks_failed: checks.filter((e) => e.ok === false).length,
    claim_checks: entries.filter((e) => e.kind === 'claim-check').length,
  };
}

function toMarkdown(entries, file, project) {
  const L = [`# Activity ledger: ${path.basename(path.resolve(project))}`];
  L.push(`Ledger file: ${file}`);
  if (!entries.length) { L.push('', 'No activity recorded yet. Entries appear after Claude edits a file or runs a command in this project (hooks.ledger must be on).'); return L.join('\n'); }
  const sessions = [];
  for (const e of entries) { let s = sessions.find((x) => x.id === e.session); if (!s) sessions.push((s = { id: e.session, entries: [] })); s.entries.push(e); }
  for (const s of sessions) {
    const sum = summarize(s.entries);
    L.push('', `## Session ${s.id ? String(s.id).slice(0, 8) : '(unknown)'} - ${s.entries[0].ts.slice(0, 16).replace('T', ' ')} to ${s.entries[s.entries.length - 1].ts.slice(11, 16)} UTC`);
    L.push(`${sum.files} files edited (${sum.edits} edits), ${sum.commands} commands, checks: ${sum.checks_passed} passed, ${sum.checks_failed} failed${sum.claim_checks ? `, claim check stepped in ${sum.claim_checks}x` : ''}`);
    L.push('');
    for (const e of s.entries) {
      const t = e.ts.slice(11, 19);
      if (e.kind === 'edit') L.push(`- ${t} edit    ${e.file}${e.ok === false ? '  (failed)' : ''}`);
      else if (e.kind === 'command') L.push(`- ${t} ${e.check ? (e.ok === false ? 'check X' : 'check ok') : 'run    '} \`${e.command}\``);
      else if (e.kind === 'claim-check') L.push(`- ${t} claim check: sent back after "${e.claim}"`);
    }
  }
  return L.join('\n');
}

function main() {
  const o = parse(process.argv.slice(2));
  if (o.help) { process.stdout.write(require('node:fs').readFileSync(__filename, 'utf8').split('\n').slice(3, 11).join('\n').replace(/^ \* ?/gm, '') + '\n'); return; }
  const file = ledger.ledgerPath(o.project);
  if (o.path) { process.stdout.write(file + '\n'); return; }
  let entries = ledger.read(o.project, { session: o.session });
  if (o.lastSession && entries.length) { const last = entries[entries.length - 1].session; entries = entries.filter((e) => e.session === last); }
  entries = entries.slice(-o.limit);
  if (o.format === 'json') process.stdout.write(JSON.stringify({ file, summary: summarize(entries), entries }, null, 2) + '\n');
  else process.stdout.write(toMarkdown(entries, file, o.project) + '\n');
}

main();
