#!/usr/bin/env node
'use strict';
/**
 * Package the implemented project into dist/vz-skills-<version>.zip and verify the archive.
 *
 * Archiver: bsdtar (`tar -a -cf`), which writes POSIX forward-slash entry names on every
 * platform. On Windows it is the built-in C:\Windows\System32\tar.exe; elsewhere `tar` or `zip`.
 * PowerShell's Compress-Archive is NOT used because it writes backslash entry names that
 * extract incorrectly on macOS/Linux (found during the 0.1.0 release audit).
 *
 * Excludes: node_modules, .git, tests/.tmp, eval results, dist, caches, *.log, *.zip.
 * Verifies: every expected file is present with the same byte size, no unexpected entries,
 * and no entry name contains a backslash. Writes dist/<name>.manifest.json with the SHA-256.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins', 'vz-skills', '.claude-plugin', 'plugin.json'), 'utf8'));
const NAME = `vz-skills-${manifest.version}`;
const DIST = process.env.VZ_PACKAGE_DIST ? path.resolve(process.env.VZ_PACKAGE_DIST) : path.join(ROOT, 'dist');
const STAGE = path.join(os.tmpdir(), `vz-skills-stage-${process.pid}`);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', '.tmp', 'results', 'cache']);
const REQUIRED = ['README.md', 'CHANGELOG.md', 'LICENSE', 'package.json', '.claude-plugin/marketplace.json', 'plugins/vz-skills/.claude-plugin/plugin.json', 'plugins/vz-skills/LICENSE', 'plugins/vz-skills/hooks/hooks.json', 'plugins/vz-skills/skills/entry/discover/SKILL.md', 'plugins/vz-skills/scripts/lib/skills.js', 'plugins/vz-skills/scripts/vz-discover.js', 'plugins/vz-skills/scripts/vz-config.js', 'docs/install.md', 'docs/decisions.md', 'tests/structure.test.js'];

function collect(dir, rel = '') {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${ent.name}` : ent.name;
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) { if (EXCLUDE_DIRS.has(ent.name)) continue; out.push(...collect(path.join(dir, ent.name), r)); }
    else if (ent.isFile()) { if (/\.(log|zip)$/.test(ent.name)) continue; out.push(r); }
  }
  return out;
}

function findArchiver() {
  if (process.platform === 'win32') {
    const sys = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
    if (fs.existsSync(sys)) return { kind: 'bsdtar', bin: sys };
  }
  for (const bin of ['bsdtar', 'tar']) {
    const r = spawnSync(bin, ['--version'], { encoding: 'utf8', windowsHide: true });
    if (r.status === 0 && /bsdtar|libarchive/i.test(r.stdout)) return { kind: 'bsdtar', bin };
  }
  const z = spawnSync('zip', ['-v'], { encoding: 'utf8', windowsHide: true });
  if (z.status === 0) return { kind: 'zip', bin: 'zip' };
  return null;
}

function listEntries(zipPath) {
  // Prefer unzip (Git Bash / coreutils); fall back to bsdtar -tvf; else .NET.
  let r = spawnSync('unzip', ['-l', zipPath], { encoding: 'utf8', windowsHide: true });
  if (r.status === 0) {
    return r.stdout.split('\n').map((l) => l.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+?)\s*$/)).filter(Boolean).filter((m) => !m[2].endsWith('/')).map((m) => ({ name: m[2], size: Number(m[1]) }));
  }
  const arch = findArchiver();
  if (arch && arch.kind === 'bsdtar') {
    r = spawnSync(arch.bin, ['-tvf', zipPath], { encoding: 'utf8', windowsHide: true });
    if (r.status === 0) return r.stdout.split('\n').map((l) => l.match(/^\S+\s+\d+\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\d+\s+\S+\s+(.+?)\s*$/)).filter(Boolean).filter((m) => !m[2].endsWith('/')).map((m) => ({ name: m[2], size: Number(m[1]) }));
  }
  r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); $z.Entries | ForEach-Object { if ($_.Name -ne '') { $_.FullName + '|' + $_.Length } }; $z.Dispose()`], { encoding: 'utf8', windowsHide: true });
  return r.stdout.split(/\r?\n/).filter(Boolean).map((l) => { const i = l.lastIndexOf('|'); return { name: l.slice(0, i), size: Number(l.slice(i + 1)) }; });
}

function main() {
  const files = collect(ROOT).sort();
  for (const r of REQUIRED) if (!files.includes(r)) { console.error(`missing required file: ${r}`); process.exit(1); }
  const archiver = findArchiver();
  if (!archiver) { console.error('no archiver found: need bsdtar (Windows built-in tar.exe) or zip'); process.exit(1); }
  fs.rmSync(STAGE, { recursive: true, force: true });
  const stageRoot = path.join(STAGE, NAME);
  for (const f of files) { const dest = path.join(stageRoot, f); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), dest); }
  fs.mkdirSync(DIST, { recursive: true });
  const zipPath = path.join(DIST, `${NAME}.zip`);
  fs.rmSync(zipPath, { force: true });
  const r = archiver.kind === 'bsdtar'
    ? spawnSync(archiver.bin, ['-a', '-cf', zipPath, '-C', STAGE, NAME], { encoding: 'utf8', windowsHide: true })
    : spawnSync(archiver.bin, ['-qr', zipPath, NAME], { cwd: STAGE, encoding: 'utf8' });
  if (r.status !== 0) { console.error(`archive failed (${archiver.kind}): ${r.stderr || r.stdout}`); process.exit(1); }
  const entries = listEntries(zipPath);
  const byName = new Map(entries.map((e) => [e.name, e.size]));
  const problems = [];
  for (const e of entries) if (e.name.includes('\\')) problems.push(`backslash in entry name: ${e.name}`);
  for (const f of files) {
    const key = `${NAME}/${f}`;
    const expected = fs.statSync(path.join(ROOT, f)).size;
    if (!byName.has(key)) problems.push(`archive missing: ${key}`);
    else if (byName.get(key) !== expected) problems.push(`size mismatch: ${key} archive=${byName.get(key)} disk=${expected}`);
  }
  const extra = [...byName.keys()].filter((k) => !files.includes(k.replace(`${NAME}/`, '')));
  if (extra.length) problems.push(`unexpected entries: ${extra.slice(0, 5).join(', ')}`);
  fs.rmSync(STAGE, { recursive: true, force: true });
  const stat = fs.statSync(zipPath);
  const sha = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
  const report = { archive: zipPath, archiver: archiver.kind, bytes: stat.size, sha256: sha, files: files.length, entries: entries.length, verified: problems.length === 0, problems };
  fs.writeFileSync(path.join(DIST, `${NAME}.manifest.json`), JSON.stringify({ ...report, file_list: files }, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(problems.length === 0 ? 0 : 1);
}

main();
