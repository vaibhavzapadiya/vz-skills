'use strict';
/**
 * Shared I/O for VZ hooks. Every hook:
 *   - reads one JSON object from stdin (with a size cap),
 *   - never throws to the caller: on any internal problem it exits 0 with no stdout
 *     (fail open) and writes a one-line reason to stderr,
 *   - prints exactly one JSON object on stdout when it has a decision.
 * See DEC-012: hooks are advisory; native Claude Code permissions remain the boundary.
 */
const fs = require('node:fs');
const path = require('node:path');

const MAX_STDIN = 2 * 1024 * 1024;

function readStdin() {
  try {
    const chunks = [];
    let total = 0;
    const fd = 0;
    const buf = Buffer.alloc(65536);
    for (;;) {
      let n;
      try { n = fs.readSync(fd, buf, 0, buf.length, null); } catch (e) {
        if (e.code === 'EAGAIN') continue;
        if (e.code === 'EOF') break;
        throw e;
      }
      if (n === 0) break;
      total += n;
      if (total > MAX_STDIN) return { error: 'stdin exceeds 2 MiB' };
      chunks.push(Buffer.from(buf.subarray(0, n)));
    }
    const text = Buffer.concat(chunks).toString('utf8').trim();
    if (!text) return { error: 'empty stdin' };
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { error: 'stdin is not a JSON object' };
    return { data };
  } catch (e) {
    return { error: `cannot parse stdin: ${e.message}` };
  }
}

function failOpen(reason) {
  process.stderr.write(`vz-skills hook: ${reason} (no decision made)\n`);
  process.exit(0);
}

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
  process.exit(0);
}

function preToolDecision(decision, reason, extra = {}) {
  return { hookSpecificOutput: Object.assign({ hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason }, extra) };
}

function projectRootFrom(input) {
  return process.env.CLAUDE_PROJECT_DIR || (input && input.cwd) || process.cwd();
}

function loadConfig(projectRoot) {
  try {
    const { resolveConfig } = require('./config');
    return resolveConfig({ projectRoot });
  } catch (e) {
    return null;
  }
}

/** Minimal glob matcher for project-relative POSIX paths: supports **, *, ? */
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
      else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

function toPosix(p) { return String(p).replace(/\\/g, '/'); }

function relativeToRoot(root, file) {
  try {
    const abs = path.isAbsolute(file) ? file : path.resolve(root, file);
    const rel = path.relative(root, abs);
    return { abs, rel: toPosix(rel), outside: rel.startsWith('..') || path.isAbsolute(rel) };
  } catch { return { abs: file, rel: toPosix(file), outside: false }; }
}

module.exports = { readStdin, failOpen, emit, preToolDecision, projectRootFrom, loadConfig, globToRegExp, toPosix, relativeToRoot };
