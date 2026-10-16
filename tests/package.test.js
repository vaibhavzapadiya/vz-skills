'use strict';
// Release packaging integrity (TC-019, REQ-019). Builds the archive into a temp dist dir and
// checks it with an independent lister. Regression: entry names must never contain backslashes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { REPO_ROOT, PLUGIN_ROOT, tmpDir, rmrf, runNode } = require('./helpers');

test('npm run package produces a verified zip with POSIX entry names and the expected contents', { timeout: 120000 }, () => {
  const dist = tmpDir('dist');
  try {
    const r = runNode(path.join(REPO_ROOT, 'scripts', 'package-release.js'), [], { env: { VZ_PACKAGE_DIST: dist }, timeout: 110000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const report = JSON.parse(r.stdout);
    assert.equal(report.verified, true, JSON.stringify(report.problems));
    assert.deepEqual(report.problems, []);
    assert.equal(report.files, report.entries);
    const version = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'), 'utf8')).version;
    assert.ok(fs.existsSync(path.join(dist, `vz-skills-${version}.zip`)));
    const manifest = JSON.parse(fs.readFileSync(path.join(dist, `vz-skills-${version}.manifest.json`), 'utf8'));
    assert.equal(manifest.sha256.length, 64);
    assert.ok(manifest.file_list.includes('README.md'));
    assert.ok(manifest.file_list.includes('plugins/vz-skills/.claude-plugin/plugin.json'));
    assert.ok(!manifest.file_list.some((f) => /(^|\/)(node_modules|\.git|dist|\.tmp|results)\//.test(f)), 'excluded dirs absent');
    // independent check with unzip when available
    const u = spawnSync('unzip', ['-l', path.join(dist, `vz-skills-${version}.zip`)], { encoding: 'utf8', windowsHide: true });
    if (u.status === 0) {
      const entryLines = u.stdout.split('\n').filter((l) => /^\s*\d+\s+\S+\s+\S+\s+\S/.test(l));
      assert.ok(entryLines.length > 100, 'entries listed');
      for (const l of entryLines) assert.ok(!l.includes('\\'), `backslash in entry: ${l}`);
      assert.match(u.stdout, new RegExp(`vz-skills-${version.replace(/\./g, '\\.')}/README\\.md`));
      const t = spawnSync('unzip', ['-t', path.join(dist, `vz-skills-${version}.zip`)], { encoding: 'utf8', windowsHide: true });
      assert.equal(t.status, 0, 'unzip -t integrity');
    }
  } finally { rmrf(dist); }
});
