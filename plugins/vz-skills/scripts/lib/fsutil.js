'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.hg', '.svn', 'vendor', 'dist', 'build', 'out', 'target',
  '.venv', 'venv', 'env', '__pycache__', '.next', '.nuxt', 'coverage', '.turbo', '.cache',
  'bin', 'obj', '.idea', '.vscode', '.gradle', '.mypy_cache', '.pytest_cache', '.ruff_cache',
  'Pods', 'DerivedData', '.terraform', '.serverless', 'site-packages', '.tox',
]);

/**
 * Bounded directory walk. Never follows symlinks. Returns relative POSIX paths.
 * @param {string} root
 * @param {{maxDepth?: number, maxEntries?: number}} opts
 */
function walk(root, opts = {}) {
  const maxDepth = opts.maxDepth ?? 4;
  const maxEntries = opts.maxEntries ?? 6000;
  const files = [];
  const dirs = [];
  let truncated = false;
  const stack = [{ abs: root, rel: '', depth: 0 }];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(cur.abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      if (files.length + dirs.length >= maxEntries) { truncated = true; break; }
      const rel = cur.rel ? `${cur.rel}/${ent.name}` : ent.name;
      if (ent.isSymbolicLink()) continue;
      if (ent.isDirectory()) {
        dirs.push(rel);
        if (SKIP_DIRS.has(ent.name)) continue;
        if (cur.depth + 1 < maxDepth) stack.push({ abs: path.join(cur.abs, ent.name), rel, depth: cur.depth + 1 });
      } else if (ent.isFile()) {
        files.push(rel);
      }
    }
    if (truncated) break;
  }
  return { files, dirs, truncated };
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readText(p, limit = 512 * 1024) {
  try {
    const st = fs.statSync(p);
    if (st.size > limit) {
      const fd = fs.openSync(p, 'r');
      const buf = Buffer.alloc(limit);
      fs.readSync(fd, buf, 0, limit, 0);
      fs.closeSync(fd);
      return { text: buf.toString('utf8'), truncated: true, size: st.size };
    }
    return { text: fs.readFileSync(p, 'utf8'), truncated: false, size: st.size };
  } catch (e) {
    return { text: null, error: e.message };
  }
}

function readJson(p) {
  const r = readText(p);
  if (r.text === null) return { data: null, error: r.error };
  try {
    return { data: JSON.parse(r.text.replace(/^﻿/, '')), error: null };
  } catch (e) {
    return { data: null, error: `JSON parse error: ${e.message}` };
  }
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

module.exports = { walk, exists, readText, readJson, toPosix, SKIP_DIRS };
