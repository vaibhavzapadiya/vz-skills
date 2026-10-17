#!/usr/bin/env node
'use strict';
/**
 * Generate a project dashboard: one self-contained HTML file that shows where the project stands.
 *
 *   node vz-dashboard.js [--project <dir>] [--out <file> | --out -] [--no-git]
 *
 * Default output: <project>/.vz-skills/dashboard.html (--out - prints to stdout). --out must stay inside
 * the project; a path outside it is refused (exit 2).
 * Sections: settings and profile, repository discovery, git state and recent commits, architecture
 * decision records, the saved checkpoint, the activity ledger, documentation, and the changelog.
 *
 * Every value is read from the repository or the ledger and HTML-escaped; the page has no scripts and
 * loads nothing from the network. Read-only except for the output file.
 * Exit codes: 0 written, 2 usage error.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { resolveConfig } = require('./lib/config');
const { discover } = require('./lib/discover');
const ledger = require('./lib/ledger');

const ADR_DIRS = ['docs/adr', 'docs/adrs', 'docs/decisions', 'doc/adr', 'doc/architecture/decisions', 'docs/architecture/decisions', 'architecture/decisions', 'adr', 'decisions'];
const MAX_DOCS = 80;

function parseArgs(argv) {
  const o = { project: process.cwd(), out: null, git: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--project') o.project = argv[++i];
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--no-git') o.git = false;
    else if (a === '-h' || a === '--help') o.help = true;
    else { process.stderr.write(`vz-dashboard: unknown option ${a}\n`); process.exit(2); }
  }
  if (!o.project || (o.out === undefined)) { process.stderr.write('vz-dashboard: --project and --out need a value\n'); process.exit(2); }
  return o;
}

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const readText = (p, max = 256 * 1024) => { try { const b = fs.readFileSync(p); return b.subarray(0, max).toString('utf8'); } catch { return null; } };

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', timeout: 10000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
  return r.status === 0 ? (r.stdout || '').trim() : null;
}

// ---------- collectors ----------

function collectAdrs(root) {
  for (const rel of ADR_DIRS) {
    const dir = path.join(root, rel);
    let names;
    try { names = fs.readdirSync(dir).filter((n) => /\.(md|markdown)$/i.test(n) && /\d/.test(n) && !/^(readme|index|template)/i.test(n)); } catch { continue; }
    if (!names.length) continue;
    const records = names.sort().map((n) => {
      const text = readText(path.join(dir, n), 64 * 1024) || '';
      const num = (n.match(/\d+/) || [''])[0];
      const title = ((text.match(/^#\s+(.+)$/m) || [])[1] || n.replace(/\.(md|markdown)$/i, '')).trim();
      const status = ((text.match(/^\s*(?:\*\*)?status(?:\*\*)?\s*:\s*\**\s*([^\n*]+)/im) || text.match(/^#+\s*status\s*\n+\s*([^\n]+)/im) || [])[1] || 'unknown').trim();
      const date = ((text.match(/^\s*(?:\*\*)?date(?:\*\*)?\s*:\s*\**\s*([0-9]{4}-[0-9]{2}-[0-9]{2})/im) || [])[1]) || '';
      return { file: `${rel}/${n}`, num, title, status, date };
    });
    return { dir: rel, records };
  }
  return { dir: null, records: [] };
}

function collectCheckpoint(root) {
  const text = readText(path.join(root, '.vz-skills', 'checkpoint.md'), 64 * 1024);
  if (!text) return null;
  const title = ((text.match(/^#\s*Checkpoint\s*-\s*(.+)$/m) || [])[1] || '').trim();
  const saved = ((text.match(/Saved:\s*([^\s]+)/) || [])[1] || '').trim();
  const next = ((text.match(/##\s*Next exact action\s*\n+([^\n]+)/i) || [])[1] || '').trim();
  const slices = text.split(/\r?\n/).filter((l) => /^\s*S\d+\b/.test(l)).slice(0, 30);
  const blockers = ((text.match(/##\s*Blockers and open questions\s*\n([\s\S]*?)(\n##|$)/i) || [])[1] || '').trim().split(/\r?\n/).filter(Boolean).slice(0, 10);
  return { title, saved, next, slices, blockers };
}

function collectDocs(root, useGit) {
  const files = [];
  const add = (rel) => { if (files.length < MAX_DOCS && fs.existsSync(path.join(root, rel))) files.push(rel); };
  for (const n of ['README.md', 'CONTRIBUTING.md', 'CHANGELOG.md', 'SECURITY.md', 'ARCHITECTURE.md', 'CLAUDE.md', 'AGENTS.md']) add(n);
  const walk = (rel, depth) => {
    if (depth > 3 || files.length >= MAX_DOCS) return;
    let ents = [];
    try { ents = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return; }
    for (const e of ents.sort((a, b) => a.name.localeCompare(b.name))) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const r = `${rel}/${e.name}`;
      if (e.isDirectory()) walk(r, depth + 1);
      else if (/\.(md|mdx|rst|adoc)$/i.test(e.name)) add(r);
    }
  };
  for (const d of ['docs', 'doc']) walk(d, 0);
  const dates = {};
  if (useGit && files.length) {
    const log = git(root, ['log', '-n', '400', '--name-only', '--format=@@%ad', '--date=short', '--', ...files]);
    let cur = null;
    for (const line of (log || '').split(/\r?\n/)) { if (line.startsWith('@@')) cur = line.slice(2); else if (line && cur && !dates[line]) dates[line] = cur; }
  }
  return files.map((rel) => {
    const text = readText(path.join(root, rel), 16 * 1024) || '';
    const title = ((text.match(/^#\s+(.+)$/m) || [])[1] || '').replace(/[*`_]/g, '').trim();
    let size = 0; try { size = fs.statSync(path.join(root, rel)).size; } catch { /* gone */ }
    return { rel, title, size, updated: dates[rel] || '' };
  });
}

function collectChangelog(root) {
  const text = readText(path.join(root, 'CHANGELOG.md'), 128 * 1024);
  if (!text) return null;
  const heads = [...text.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  const unreleased = /^##\s+\[?unreleased\]?/im.test(text);
  const unreleasedBody = unreleased ? ((text.match(/^##\s+\[?unreleased\]?[^\n]*\n([\s\S]*?)(?=^##\s)/im) || [])[1] || '').trim() : '';
  return { latest: heads.find((h) => !/unreleased/i.test(h)) || null, unreleased, unreleasedItems: unreleasedBody.split(/\r?\n/).filter((l) => /^\s*[-*]\s/.test(l)).length };
}

function collectGit(root) {
  if (!git(root, ['rev-parse', '--is-inside-work-tree'])) return null;
  const commits = (git(root, ['log', '-n', '15', '--format=%h%x09%ad%x09%an%x09%s', '--date=short']) || '').split(/\r?\n/).filter(Boolean).map((l) => { const [hash, date, author, ...s] = l.split('\t'); return { hash, date, author, subject: s.join('\t') }; });
  return { lastTag: git(root, ['describe', '--tags', '--abbrev=0']), commits, upstream: git(root, ['rev-parse', '--abbrev-ref', '@{upstream}']), aheadBehind: git(root, ['rev-list', '--left-right', '--count', 'HEAD...@{upstream}']) };
}

// ---------- rendering ----------

const CSS = `
:root{--bg:#f7f7f5;--card:#fff;--fg:#1b1b18;--muted:#6b6b63;--line:#e4e4de;--ok:#1f7a3f;--warn:#9a6700;--bad:#b42318;--chip:#efefea;--accent:#3b4cca}
@media (prefers-color-scheme:dark){:root{--bg:#121211;--card:#1b1b19;--fg:#ecece6;--muted:#a3a39a;--line:#2e2e2a;--ok:#4cc27a;--warn:#e0b341;--bad:#f0705f;--chip:#262623;--accent:#8f9bff}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 48px}h1{font-size:26px;margin:0 0 4px}h2{font-size:15px;margin:0 0 12px;letter-spacing:.02em}
.sub{color:var(--muted);margin-bottom:22px}.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:16px 18px;min-width:0}.wide{grid-column:1/-1}
.stats{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:14px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}.stat b{display:block;font-size:22px}.stat span{color:var(--muted);font-size:12px}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;padding:5px 6px;border-bottom:1px solid var(--line);vertical-align:top;overflow-wrap:anywhere}th{color:var(--muted);font-weight:600}
code{font:12px/1.4 ui-monospace,"Cascadia Code",Consolas,monospace;background:var(--chip);padding:1px 4px;border-radius:4px;overflow-wrap:anywhere}
.chip{display:inline-block;font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:var(--chip)}
.ok{color:var(--ok)}.warn{color:var(--warn)}.bad{color:var(--bad)}.muted{color:var(--muted)}ul{margin:6px 0;padding-left:18px}
.scroll{max-height:360px;overflow:auto}footer{color:var(--muted);font-size:12px;margin-top:22px}`;

const LABEL_CLASS = { CONFIRMED: 'ok', INFERRED: 'warn', UNKNOWN: 'bad', CONFLICTING: 'bad' };
const chip = (text, cls = '') => `<span class="chip ${cls}">${esc(text)}</span>`;
const fact = (f) => (f && f.value !== undefined && f.value !== null ? `${esc(f.value)} ${chip(f.status, LABEL_CLASS[f.status])}` : chip('UNKNOWN', 'bad'));
const statusClass = (s) => (/accepted|done|verified|approved/i.test(s) ? 'ok' : /proposed|draft|pending|in progress/i.test(s) ? 'warn' : /superseded|deprecated|rejected|blocked/i.test(s) ? 'muted' : '');
const table = (head, rows) => (rows.length ? `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '<p class="muted">None.</p>');

function render(d) {
  const r = d.discovery;
  const cfg = d.config;
  const act = d.activity;
  const stat = (n, label, cls = '') => `<div class="stat"><b class="${cls}">${esc(n)}</b><span>${esc(label)}</span></div>`;
  const adrOpen = d.adrs.records.filter((a) => /proposed|draft/i.test(a.status)).length;
  const dirty = r.git && r.git.dirty_files ? r.git.dirty_files.length + (r.git.untracked_files || []).length : 0;
  const S = [];
  S.push(`<h1>${esc(d.name)}</h1><div class="sub">Project dashboard generated ${esc(d.generated.slice(0, 16).replace('T', ' '))} UTC by vz-skills. Every value comes from the repository; nothing is estimated.</div>`);
  S.push('<div class="stats">'
    + stat(cfg ? cfg.profile : 'n/a', 'VZ profile')
    + stat(r.git && r.git.branch && r.git.branch.value ? r.git.branch.value : 'n/a', 'branch')
    + stat(dirty, 'uncommitted files', dirty ? 'warn' : 'ok')
    + stat(d.adrs.records.length, `decision records${adrOpen ? ` (${adrOpen} proposed)` : ''}`)
    + stat(act.summary.checks_failed ? `${act.summary.checks_passed}/${act.summary.checks_passed + act.summary.checks_failed}` : act.summary.checks_passed, 'checks passed (ledger)', act.summary.checks_failed ? 'warn' : 'ok')
    + stat(d.docs.length, 'documentation files')
    + '</div>');
  S.push('<div class="grid">');

  // where we stand: checkpoint
  const cp = d.checkpoint;
  S.push(`<section class="card"><h2>Current task</h2>${cp ? `<p><b>${esc(cp.title || '(untitled)')}</b> <span class="muted">saved ${esc(cp.saved)}</span></p>${cp.next ? `<p>Next: ${esc(cp.next)}</p>` : ''}${cp.slices.length ? `<ul>${cp.slices.map((s) => `<li>${esc(s.trim())}</li>`).join('')}</ul>` : ''}${cp.blockers.length ? `<p class="warn">Blockers:</p><ul>${cp.blockers.map((b) => `<li>${esc(b.replace(/^[-*]\s*/, ''))}</li>`).join('')}</ul>` : ''}` : '<p class="muted">No saved checkpoint (.vz-skills/checkpoint.md). Run /checkpoint save during a task.</p>'}</section>`);

  // settings
  S.push(`<section class="card"><h2>Settings</h2>${cfg ? table(['Setting', 'Value'], [
    ['profile', `${esc(cfg.profile)} <span class="muted">(${esc(cfg.sources.profile)})</span>`],
    ['testing', esc(`${cfg.effective.testing.strategy}, baseline ${cfg.effective.testing.require_baseline ? 'on' : 'off'}`)],
    ['review / security', esc(`${cfg.effective.review.depth} / ${cfg.effective.security.review_trigger}`)],
    ['guards', esc(`command ${cfg.effective.hooks.command_guard}, write ${cfg.effective.hooks.write_guard}, claim check ${cfg.effective.hooks.claim_check ? 'on' : 'off'}`)],
    ['approvals', esc(`external ${cfg.effective.approvals.external_actions}, scripts ${cfg.effective.approvals.run_project_scripts}`)],
  ]) + (cfg.errors.length ? `<p class="bad">${cfg.errors.length} configuration error(s):</p><ul>${cfg.errors.slice(0, 5).map((e) => `<li>${esc(e.message)}</li>`).join('')}</ul>` : '') : '<p class="muted">Configuration could not be resolved.</p>'}</section>`);

  // stack and commands
  S.push(`<section class="card"><h2>Stack and commands</h2>${table(['', ''], [
    ['languages', r.stack.languages.map(fact).join(' ') || chip('UNKNOWN', 'bad')],
    ['package manager', r.package_managers.map(fact).join(' ') || chip('UNKNOWN', 'bad')],
    ...['build', 'test', 'lint', 'typecheck', 'format'].map((k) => [k, r.commands[k] && r.commands[k].value ? `<code>${esc(r.commands[k].value)}</code> ${chip(r.commands[k].status, LABEL_CLASS[r.commands[k].status])}` : chip('UNKNOWN', 'bad')]),
    ['tests', `${fact(r.tests.present)} <span class="muted">${esc(r.tests.files_count || 0)} files</span>`],
    ['CI', r.ci.length ? r.ci.map((c) => `<code>${esc(c.path)}</code>`).join(' ') : '<span class="muted">none found</span>'],
  ])}${r.unknowns.length ? `<p class="muted">Unknown: ${esc(r.unknowns.slice(0, 6).join('; '))}</p>` : ''}</section>`);

  // git
  const g = d.git;
  S.push(`<section class="card"><h2>Git</h2>${g ? `<p>Branch ${fact(r.git.branch)}${g.upstream ? ` tracking <code>${esc(g.upstream)}</code>` : ''}${g.aheadBehind ? ` <span class="muted">(ahead ${esc(g.aheadBehind.split(/\s+/)[0])}, behind ${esc(g.aheadBehind.split(/\s+/)[1])})</span>` : ''}. Last tag: ${g.lastTag ? `<code>${esc(g.lastTag)}</code>` : '<span class="muted">none</span>'}.</p>${dirty ? `<p class="warn">${dirty} uncommitted: ${esc([...(r.git.dirty_files || []).map((f) => f.path), ...(r.git.untracked_files || [])].slice(0, 12).join(', '))}</p>` : '<p class="ok">Working tree clean.</p>'}<div class="scroll">${table(['Commit', 'Date', 'Author', 'Subject'], g.commits.map((c) => [`<code>${esc(c.hash)}</code>`, esc(c.date), esc(c.author), esc(c.subject)]))}</div>` : '<p class="muted">Not a git repository.</p>'}</section>`);

  // ADRs
  S.push(`<section class="card wide"><h2>Architecture decisions${d.adrs.dir ? ` <span class="muted">(${esc(d.adrs.dir)})</span>` : ''}</h2>${d.adrs.records.length ? `<div class="scroll">${table(['#', 'Decision', 'Status', 'Date'], d.adrs.records.slice().reverse().map((a) => [esc(a.num), `${esc(a.title)}<br><span class="muted">${esc(a.file)}</span>`, `<span class="${statusClass(a.status)}">${esc(a.status)}</span>`, esc(a.date)]))}</div>` : '<p class="muted">No architecture decision records found. Use /adr to record lasting decisions.</p>'}</section>`);

  // activity
  S.push(`<section class="card"><h2>AI activity (ledger)</h2>${act.entries.length ? `<p>${esc(act.summary.files)} files edited, ${esc(act.summary.commands)} commands, checks <span class="ok">${esc(act.summary.checks_passed)} passed</span>${act.summary.checks_failed ? `, <span class="bad">${esc(act.summary.checks_failed)} failed</span>` : ''}${act.summary.claim_checks ? `, claim check stepped in ${esc(act.summary.claim_checks)}x` : ''} <span class="muted">across ${esc(act.sessions)} session(s)</span>.</p><div class="scroll">${table(['When (UTC)', 'What'], act.entries.slice(-25).reverse().map((e) => [esc(e.ts.slice(0, 16).replace('T', ' ')), e.kind === 'edit' ? `edit <code>${esc(e.file)}</code>` : e.kind === 'claim-check' ? `<span class="warn">claim check: sent back after "${esc(e.claim)}"</span>` : `${e.check ? (e.ok === false ? '<span class="bad">check failed</span>' : '<span class="ok">check passed</span>') : 'ran'} <code>${esc(e.command)}</code>`]))}</div>` : '<p class="muted">No activity recorded for this project yet.</p>'}</section>`);

  // instructions and risks
  const suspicious = r.instructions.filter((i) => i.suspicious && i.suspicious.length);
  S.push(`<section class="card"><h2>Instructions and risks</h2>${table(['File', 'Note'], [
    ...r.instructions.map((i) => [`<code>${esc(i.path)}</code>`, i.suspicious && i.suspicious.length ? `<span class="bad">suspicious: ${esc(i.suspicious.map((s) => s.indicator).join(', '))}</span>` : `<span class="muted">${esc(i.kind)}</span>`]),
    ...(r.sensitive_paths.length ? [[`${esc(r.sensitive_paths.length)} sensitive file(s)`, `<span class="muted">listed by name only: ${esc(r.sensitive_paths.slice(0, 6).map((s) => s.path).join(', '))}</span>`]] : []),
  ])}${suspicious.length ? '<p class="bad">Review the suspicious instruction files before trusting them.</p>' : ''}</section>`);

  // docs
  const cl = d.changelog;
  S.push(`<section class="card wide"><h2>Documentation</h2>${cl ? `<p>Changelog: latest ${cl.latest ? `<code>${esc(cl.latest)}</code>` : '<span class="muted">no released section</span>'}${cl.unreleased ? `, <span class="warn">${esc(cl.unreleasedItems)} unreleased item(s)</span>` : ''}.</p>` : '<p class="muted">No CHANGELOG.md.</p>'}<div class="scroll">${table(['File', 'Title', 'Last changed', 'Size'], d.docs.map((f) => [`<code>${esc(f.rel)}</code>`, esc(f.title), esc(f.updated || '-'), esc(`${Math.max(1, Math.round(f.size / 1024))} KB`)]))}</div></section>`);

  S.push('</div>');
  S.push(`<footer>Regenerate with /dashboard. Source: ${esc(d.root)}. Ledger: ${esc(act.file)}.</footer>`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${esc(d.name)} - project dashboard</title><style>${CSS}</style></head><body><main>${S.join('\n')}</main></body></html>\n`;
}

function build(project, { useGit = true } = {}) {
  const root = path.resolve(project);
  let config = null;
  try { config = resolveConfig({ projectRoot: root }); } catch { /* shown as unavailable */ }
  const discovery = discover(root, { tools: false, git: useGit, maxDepth: 4 });
  const entries = ledger.read(root);
  const summary = { files: new Set(entries.filter((e) => e.kind === 'edit').map((e) => e.file)).size, commands: entries.filter((e) => e.kind === 'command').length, checks_passed: entries.filter((e) => e.check && e.ok !== false).length, checks_failed: entries.filter((e) => e.check && e.ok === false).length, claim_checks: entries.filter((e) => e.kind === 'claim-check').length };
  return {
    name: path.basename(root), root, generated: new Date().toISOString(), config, discovery,
    git: useGit ? collectGit(root) : null, adrs: collectAdrs(root), checkpoint: collectCheckpoint(root), docs: collectDocs(root, useGit), changelog: collectChangelog(root),
    activity: { file: ledger.ledgerPath(root), entries, summary, sessions: new Set(entries.map((e) => e.session)).size },
  };
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) { process.stdout.write(fs.readFileSync(__filename, 'utf8').split('\n').slice(3, 15).join('\n').replace(/^ \* ?/gm, '') + '\n'); return; }
  const html = render(build(o.project, { useGit: o.git }));
  if (o.out === '-') { process.stdout.write(html); return; }
  const root = path.resolve(o.project);
  const out = path.resolve(root, o.out || path.join('.vz-skills', 'dashboard.html'));
  const rel = path.relative(root, out);
  if (rel.startsWith('..') || path.isAbsolute(rel)) { process.stderr.write(`vz-dashboard: refusing to write outside the project root: ${out}\n`); process.exit(2); }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
  process.stdout.write(`wrote ${out}\n`);
}

if (require.main === module) main();
module.exports = { build, render, esc };
