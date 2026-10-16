#!/usr/bin/env node
'use strict';
/**
 * Package the implemented project into dist/vz-skills-<version>.zip and verify the archive.
 * Uses PowerShell Compress-Archive on Windows and `zip` elsewhere (no npm dependencies).
 * Excludes: node_modules, .git, tests/.tmp, eval results, dist, caches.
 * Verifies: the archive lists every expected file, byte sizes match, and required files are present.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins', 'vz-skills', '.claude-plugin', 'plugin.json'), 'utf8'));
const NAME = `vz-skills-${manifest.version}`;
const DIST = path.join(ROOT, 'dist');
const STAGE = path.join(os.tmpdir(), `vz-skills-stage-${process.pid}`);
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'dist', '.tmp', 'results', 'cache']);
const REQUIRED = ['README.md', 'CHANGELOG.md', 'package.json', '.claude-plugin/marketplace.json', 'plugins/vz-skills/.claude-plugin/plugin.json', 'plugins/vz-skills/hooks/hooks.json', 'plugins/vz-skills/skills/discover/SKILL.md', 'plugins/vz-skills/scripts/vz-discover.js', 'plugins/vz-skills/scripts/vz-config.js', 'docs/install.md', 'project/PROGRESS.md', 'project/acceptance-matrix.md', 'tests/structure.test.js'];

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

function main() {
  const files = collect(ROOT).sort();
  for (const r of REQUIRED) if (!files.includes(r)) { console.error(`missing required file: ${r}`); process.exit(1); }
  fs.rmSync(STAGE, { recursive: true, force: true });
  const stageRoot = path.join(STAGE, NAME);
  for (const f of files) { const dest = path.join(stageRoot, f); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), dest); }
  fs.mkdirSync(DIST, { recursive: true });
  const zipPath = path.join(DIST, `${NAME}.zip`);
  fs.rmSync(zipPath, { force: true });
  let r;
  if (process.platform === 'win32') {
    r = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Compress-Archive -Path '${stageRoot}' -DestinationPath '${zipPath}' -CompressionLevel Optimal`], { encoding: 'utf8', windowsHide: true });
  } else {
    r = spawnSync('zip', ['-qr', zipPath, NAME], { cwd: STAGE, encoding: 'utf8' });
  }
  if (r.status !== 0) { console.error(`archive failed: ${r.stderr || r.stdout}`); process.exit(1); }
  // verify: list entries and compare sizes
  let entries = [];
  if (process.platform === 'win32') {
    const list = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem; $z=[System.IO.Compression.ZipFile]::OpenRead('${zipPath}'); $z.Entries | ForEach-Object { if ($_.Name -ne '') { $_.FullName + '|' + $_.Length } }; $z.Dispose()`], { encoding: 'utf8', windowsHide: true });
    entries = list.stdout.split(/\r?\n/).filter(Boolean).map((l) => { const [n, s] = l.split('|'); return { name: n.replace(/\\/g, '/'), size: Number(s) }; });
  } else {
    const list = spawnSync('unzip', ['-l', zipPath], { encoding: 'utf8' });
    entries = list.stdout.split('\n').map((l) => l.trim().match(/^(\d+)\s+\S+\s+\S+\s+(.+)$/)).filter(Boolean).filter((m) => !m[2].endsWith('/')).map((m) => ({ name: m[2], size: Number(m[1]) }));
  }
  const byName = new Map(entries.map((e) => [e.name, e.size]));
  let bad = 0;
  for (const f of files) {
    const key = `${NAME}/${f}`;
    const expected = fs.statSync(path.join(ROOT, f)).size;
    if (!byName.has(key)) { console.error(`archive missing: ${key}`); bad++; }
    else if (byName.get(key) !== expected) { console.error(`size mismatch: ${key} archive=${byName.get(key)} disk=${expected}`); bad++; }
  }
  const extra = [...byName.keys()].filter((k) => !files.includes(k.replace(`${NAME}/`, '')));
  if (extra.length) { console.error(`unexpected entries: ${extra.slice(0, 5).join(', ')}`); bad++; }
  fs.rmSync(STAGE, { recursive: true, force: true });
  const stat = fs.statSync(zipPath);
  const crypto = require('node:crypto');
  const sha = crypto.createHash('sha256').update(fs.readFileSync(zipPath)).digest('hex');
  const report = { archive: zipPath, bytes: stat.size, sha256: sha, files: files.length, entries: entries.length, verified: bad === 0 };
  fs.writeFileSync(path.join(DIST, `${NAME}.manifest.json`), JSON.stringify({ ...report, file_list: files }, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(bad === 0 ? 0 : 1);
}

main();
