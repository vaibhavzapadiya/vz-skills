'use strict';
/**
 * Minimal YAML-subset frontmatter parser for SKILL.md / agent files.
 * Supports: scalar `key: value`, quoted scalars, booleans, numbers,
 * inline lists `[a, b]`, block lists (`- item`), and one level of nested maps.
 * Anything else is reported as a parse warning rather than guessed.
 */

function stripQuotes(v) {
  if (v.length >= 2 && ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function coerce(v) {
  const raw = v.trim();
  if (raw === '') return '';
  const quoted = raw[0] === '"' || raw[0] === "'";
  const s = stripQuotes(raw);
  if (quoted) return s;
  if (/^(true|yes|on)$/i.test(s)) return true;
  if (/^(false|no|off)$/i.test(s)) return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((x) => stripQuotes(x.trim()));
  }
  return s;
}

/**
 * @param {string} text full file contents
 * @returns {{ data: object|null, body: string, warnings: string[], hasFrontmatter: boolean }}
 */
function parseFrontmatter(text) {
  const warnings = [];
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { data: null, body: normalized, warnings: ['file does not start with --- on line 1'], hasFrontmatter: false };
  }
  const end = normalized.indexOf('\n---', 4);
  if (end === -1) {
    return { data: null, body: normalized, warnings: ['frontmatter has no closing ---'], hasFrontmatter: false };
  }
  const block = normalized.slice(4, end);
  const body = normalized.slice(end + 4).replace(/^\n/, '');
  const data = {};
  const lines = block.split('\n');
  let currentKey = null;
  let currentIndent = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const indent = line.match(/^\s*/)[0].length;
    const trimmed = line.trim();
    if (indent > 0 && currentKey !== null) {
      // nested content under currentKey
      if (trimmed.startsWith('- ')) {
        if (!Array.isArray(data[currentKey])) {
          if (data[currentKey] === '' || data[currentKey] === undefined) data[currentKey] = [];
          else { warnings.push(`line ${i + 1}: list item under scalar key "${currentKey}"`); continue; }
        }
        data[currentKey].push(coerce(trimmed.slice(2)));
        continue;
      }
      const m = trimmed.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
      if (m) {
        if (typeof data[currentKey] !== 'object' || Array.isArray(data[currentKey]) || data[currentKey] === null) {
          if (data[currentKey] === '' || data[currentKey] === undefined) data[currentKey] = {};
          else { warnings.push(`line ${i + 1}: nested key under scalar key "${currentKey}"`); continue; }
        }
        if (indent > currentIndent + 4 && m[2] === '') {
          warnings.push(`line ${i + 1}: nesting deeper than supported under "${currentKey}"`);
        }
        data[currentKey][m[1]] = coerce(m[2]);
        continue;
      }
      warnings.push(`line ${i + 1}: unparsed nested line "${trimmed}"`);
      continue;
    }
    const m = trimmed.match(/^([A-Za-z0-9_.-]+):\s*(.*)$/);
    if (!m) {
      warnings.push(`line ${i + 1}: unparsed line "${trimmed}"`);
      continue;
    }
    currentKey = m[1];
    currentIndent = indent;
    if (Object.prototype.hasOwnProperty.call(data, currentKey)) {
      warnings.push(`line ${i + 1}: duplicate key "${currentKey}"`);
    }
    data[currentKey] = m[2] === '' ? '' : coerce(m[2]);
  }
  return { data, body, warnings, hasFrontmatter: true };
}

module.exports = { parseFrontmatter, coerce };
