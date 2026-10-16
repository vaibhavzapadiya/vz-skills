#!/usr/bin/env node
'use strict';
/**
 * vz-discover: grounded repository discovery.
 *
 * Usage:
 *   node vz-discover.js [root] [--format json|md] [--brief] [--out <file>]
 *                       [--run-baseline] [--baseline-timeout <ms>] [--no-git] [--no-tools]
 *                       [--max-depth <n>] [--cache] [--cached]
 *
 * Exit codes: 0 report produced; 2 usage error; 3 root unreadable.
 * Never runs project scripts unless --run-baseline is given AND the detected
 * test command is on a conservative allowlist.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { discover, toMarkdown } = require('./lib/discover');

function parseArgs(argv) {
  const o = { root: null, format: 'json', brief: false, out: null, runBaseline: false, git: true, tools: true, maxDepth: 4, cache: false, cached: false, baselineTimeoutMs: 600000 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--format') o.format = argv[++i];
    else if (a === '--brief') o.brief = true;
    else if (a === '--out') o.out = argv[++i];
    else if (a === '--run-baseline') o.runBaseline = true;
    else if (a === '--baseline-timeout') o.baselineTimeoutMs = Number(argv[++i]);
    else if (a === '--no-git') o.git = false;
    else if (a === '--no-tools') o.tools = false;
    else if (a === '--max-depth') o.maxDepth = Number(argv[++i]);
    else if (a === '--cache') o.cache = true;
    else if (a === '--cached') o.cached = true;
    else if (a === '-h' || a === '--help') { o.help = true; }
    else if (a.startsWith('--')) { throw new Error(`unknown option ${a}`); }
    else if (!o.root) o.root = a;
    else throw new Error(`unexpected argument ${a}`);
  }
  if (!['json', 'md'].includes(o.format)) throw new Error('--format must be json or md');
  if (!Number.isFinite(o.maxDepth) || o.maxDepth < 1 || o.maxDepth > 12) throw new Error('--max-depth must be 1..12');
  return o;
}

function cacheKey(root) {
  const h = crypto.createHash('sha256');
  for (const f of ['package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml', 'Makefile', 'CLAUDE.md', 'AGENTS.md']) {
    try { const st = fs.statSync(path.join(root, f)); h.update(`${f}:${st.size}:${st.mtimeMs};`); } catch { h.update(`${f}:absent;`); }
  }
  try { h.update(fs.readFileSync(path.join(root, '.git', 'HEAD'), 'utf8')); } catch { /* no git */ }
  return h.digest('hex').slice(0, 16);
}

function main() {
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { process.stderr.write(`vz-discover: ${e.message}\n`); process.exit(2); }
  if (o.help) {
    process.stdout.write(fs.readFileSync(__filename, 'utf8').split('\n').slice(2, 14).join('\n').replace(/^ \* ?/gm, '') + '\n');
    return;
  }
  const root = path.resolve(o.root || process.cwd());
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) { process.stderr.write(`vz-discover: root is not a directory: ${root}\n`); process.exit(3); }
  const cacheDir = path.join(root, '.vz-skills', 'cache');
  const cacheFile = path.join(cacheDir, 'discovery.json');
  const key = cacheKey(root);
  let report = null;
  if (o.cached && !o.runBaseline) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cached && cached.cache_key === key && cached.report && cached.report.schema) { report = cached.report; report.from_cache = true; }
    } catch { /* no usable cache */ }
  }
  if (!report) {
    report = discover(root, { runBaseline: o.runBaseline, git: o.git, tools: o.tools, maxDepth: o.maxDepth, baselineTimeoutMs: o.baselineTimeoutMs });
    if (o.cache) {
      try {
        // Only write a cache when the project has opted in by having a .vz-skills directory.
        if (fs.existsSync(path.join(root, '.vz-skills'))) {
          fs.mkdirSync(cacheDir, { recursive: true });
          fs.writeFileSync(cacheFile, JSON.stringify({ cache_key: key, written_at: new Date().toISOString(), report }, null, 2));
        } else {
          report.warnings.push('cache not written: .vz-skills/ does not exist (run /vz-skills:setup to opt in)');
        }
      } catch (e) { report.warnings.push(`cache write failed: ${e.message}`); }
    }
  }
  const text = o.format === 'md' ? toMarkdown(report, { brief: o.brief }) : JSON.stringify(report, null, 2);
  if (o.out) {
    const outAbs = path.resolve(o.out);
    const rel = path.relative(root, outAbs);
    if (rel.startsWith('..') || path.isAbsolute(rel)) { process.stderr.write(`vz-discover: refusing to write outside the repository root: ${outAbs}\n`); process.exit(2); }
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, text + '\n');
    process.stdout.write(`wrote ${outAbs}\n`);
  } else {
    process.stdout.write(text + '\n');
  }
}

if (require.main === module) main();
module.exports = { parseArgs, cacheKey };
