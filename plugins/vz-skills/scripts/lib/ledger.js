'use strict';
/**
 * The activity ledger: one JSON line per file edit or shell command Claude made in a project,
 * written by the PostToolUse hook (scripts/hooks/ledger.js) and read by the claim check, /ledger,
 * and the dashboard.
 *
 * It lives outside the repository, in $VZ_SKILLS_HOME/ledger/ (default ~/.vz-skills/ledger/), one
 * file per project, so it is never committed by accident. Commands are truncated and secret-looking
 * values redacted before they are written. The file rotates at 5 MB (one previous file is kept).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_COMMAND = 300;

function home() {
  return process.env.VZ_SKILLS_HOME ? path.resolve(process.env.VZ_SKILLS_HOME) : path.join(os.homedir(), '.vz-skills');
}

/**
 * The project a directory belongs to: the nearest ancestor with .git or .vz-skills, else the directory.
 * Hooks receive the shell's current directory, which moves when Claude runs `cd src`; every hook must
 * still write to and read from the same ledger.
 */
function projectOf(dir) {
  let cur = path.resolve(dir || process.cwd());
  for (let i = 0; i < 40; i++) {
    if (fs.existsSync(path.join(cur, '.git')) || fs.existsSync(path.join(cur, '.vz-skills'))) return cur;
    const up = path.dirname(cur);
    if (up === cur) break;
    cur = up;
  }
  return path.resolve(dir || process.cwd());
}

/** The ledger file for a project: <home>/ledger/<folder-name>-<hash of the full path>.jsonl */
function ledgerPath(projectRoot) {
  let root = projectOf(projectRoot);
  try { root = fs.realpathSync.native(root); } catch { /* keep the resolved path */ }
  const key = process.platform === 'win32' || process.platform === 'darwin' ? root.toLowerCase() : root;
  const hash = crypto.createHash('sha1').update(key).digest('hex').slice(0, 10);
  const name = (path.basename(root) || 'root').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 40);
  return path.join(home(), 'ledger', `${name}-${hash}.jsonl`);
}

/** Remove values that look like credentials from a command line before it is stored. */
function redact(text) {
  return String(text)
    .replace(/(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk-[A-Za-z0-9_-]{20,}|sk_live_[A-Za-z0-9]{10,}|npm_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})/g, '[REDACTED]')
    .replace(/\b([A-Za-z_]*(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|APIKEY|PRIVATE_KEY)[A-Za-z_]*)\s*=\s*("[^"]*"|'[^']*'|\S+)/gi, '$1=[REDACTED]')
    .replace(/(--?(?:password|token|secret|api-key|apikey)[= ])("[^"]*"|'[^']*'|\S+)/gi, '$1[REDACTED]')
    .replace(/(\/\/[^/\s:@]+:)[^@\s/]+@/g, '$1[REDACTED]@');
}

// Commands that check the code: tests, linters, type checkers, builds. Used by the claim check.
const CHECK_COMMAND = /(^|[\s;&|(])((npm|pnpm|yarn|bun)\s+(run\s+)?(test|lint|typecheck|type-check|check|build|verify)\b|npx\s+(jest|vitest|mocha|tsc|eslint|playwright)\b|(jest|vitest|mocha|ava|tap|karma|playwright|cypress)\b|node\s+--test\b|pytest\b|python\s+-m\s+(pytest|unittest)\b|tox\b|nox\b|ruff\s+check\b|mypy\b|pyright\b|flake8\b|pylint\b|go\s+(test|vet|build)\b|golangci-lint\b|cargo\s+(test|check|clippy|build)\b|dotnet\s+(test|build)\b|(\.\/)?mvnw?\s+([\w:-]+\s+)*(test|verify|package)\b|(\.\/)?gradlew?\s+([\w:-]+\s+)*(test|check|build)\b|make\s+(test|tests|check|lint|build)\b|bundle\s+exec\s+(rspec|rake)\b|rspec\b|phpunit\b|vendor\/bin\/phpunit\b|mix\s+test\b|swift\s+test\b|tsc\b|eslint\b|biome\s+(check|lint)\b|deno\s+(test|check|lint)\b)/i;

function isCheckCommand(cmd) { return CHECK_COMMAND.test(String(cmd || '')); }

function append(projectRoot, entry) {
  const file = ledgerPath(projectRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  try { if (fs.statSync(file).size > MAX_BYTES) fs.renameSync(file, file.replace(/\.jsonl$/, '.1.jsonl')); } catch { /* no file yet */ }
  const e = Object.assign({ ts: new Date().toISOString() }, entry);
  if (e.command) e.command = redact(e.command).replace(/\s+/g, ' ').trim().slice(0, MAX_COMMAND);
  fs.appendFileSync(file, JSON.stringify(e) + '\n');
  return file;
}

/** Entries for a project, oldest first. Options: session (only that session), limit (last N). */
function read(projectRoot, { session = null, limit = 0, file = null } = {}) {
  const f = file || ledgerPath(projectRoot);
  let text = '';
  try {
    // read at most the last 2 MB: enough for weeks of activity, bounded for the Stop hook
    const size = fs.statSync(f).size;
    const start = Math.max(0, size - 2 * 1024 * 1024);
    const fd = fs.openSync(f, 'r');
    try { const buf = Buffer.alloc(size - start); fs.readSync(fd, buf, 0, buf.length, start); text = buf.toString('utf8'); } finally { fs.closeSync(fd); }
    if (start > 0) text = text.slice(text.indexOf('\n') + 1);
  } catch { return []; }
  const out = [];
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try { const e = JSON.parse(line); if (!session || e.session === session) out.push(e); } catch { /* skip a torn line */ }
  }
  return limit > 0 ? out.slice(-limit) : out;
}

module.exports = { ledgerPath, projectOf, append, read, redact, isCheckCommand, home };
