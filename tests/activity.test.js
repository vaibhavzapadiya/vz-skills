'use strict';
// The activity ledger, the claim check, /ledger, and the project dashboard.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SCRIPTS, tmpDir, rmrf, runHook, runNode, git } = require('./helpers');

function sandbox() {
  const home = tmpDir('vzhome');
  const proj = tmpDir('vzproj');
  // tests/.tmp sits inside this repository; a .git marker makes the sandbox its own project root
  fs.mkdirSync(path.join(proj, '.git'));
  // HOME/USERPROFILE too, so the user config of whoever runs the tests is never read
  const env = { VZ_SKILLS_HOME: home, HOME: home, USERPROFILE: home };
  const post = (tool, input, event = 'PostToolUse', session = 's1') => runHook('ledger.js', { hook_event_name: event, session_id: session, cwd: proj, tool_name: tool, tool_input: input }, env);
  const stop = (message, extra = {}) => runHook('claim-check.js', Object.assign({ hook_event_name: 'Stop', session_id: 's1', cwd: proj, last_assistant_message: message }, extra), env);
  const ledgerFile = () => { const d = path.join(home, 'ledger'); return fs.existsSync(d) ? path.join(d, fs.readdirSync(d)[0]) : null; };
  const lines = () => { const f = ledgerFile(); return f ? fs.readFileSync(f, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : []; };
  return { home, proj, env, post, stop, lines, ledgerFile, cleanup: () => { rmrf(home); rmrf(proj); } };
}
const blocked = (r) => (r.json && r.json.decision === 'block' ? r.json.reason : null);

test('ledger hook records edits and commands outside the repository, marks checks and failures, and redacts secrets', () => {
  const s = sandbox();
  try {
    assert.equal(s.post('Edit', { file_path: path.join(s.proj, 'src', 'a.ts') }).stdout, '', 'silent');
    s.post('Bash', { command: 'npm test -- a.test.ts' });
    s.post('Bash', { command: 'pytest -q' }, 'PostToolUseFailure');
    s.post('Bash', { command: 'ls -la' });
    s.post('Bash', { command: 'curl https://u:hunter2pass@example.com && export API_TOKEN=abcd1234secret' });
    s.post('Read', { file_path: path.join(s.proj, 'x') });
    const e = s.lines();
    assert.equal(e.length, 5, 'Read is not recorded');
    assert.deepEqual(e.map((x) => x.kind), ['edit', 'command', 'command', 'command', 'command']);
    assert.equal(e[0].file, 'src/a.ts');
    assert.deepEqual(e.slice(1, 4).map((x) => [x.check, x.ok]), [[true, true], [true, false], [false, true]]);
    assert.doesNotMatch(e[4].command, /hunter2pass|abcd1234secret/);
    assert.ok(!fs.existsSync(path.join(s.proj, '.vz-skills')), 'nothing written into the project');
    // hooks.ledger: false stops recording
    fs.mkdirSync(path.join(s.proj, '.vz-skills'));
    fs.writeFileSync(path.join(s.proj, '.vz-skills', 'config.json'), JSON.stringify({ version: 1, hooks: { ledger: false } }));
    s.post('Bash', { command: 'npm test' });
    assert.equal(s.lines().length, 5);
  } finally { s.cleanup(); }
});

test('claim check sends Claude back only for unbacked success claims after a code change', () => {
  const s = sandbox();
  try {
    assert.equal(blocked(s.stop('Done. The function returns a list.')), null, 'no edits: a question was answered');
    s.post('Edit', { file_path: path.join(s.proj, 'README.md') });
    assert.equal(blocked(s.stop('All done, README updated.')), null, 'docs-only edits need no test run');
    s.post('Edit', { file_path: path.join(s.proj, 'src', 'parser.ts') });
    const r = blocked(s.stop('I fixed the parser. All tests pass now.'));
    assert.match(r, /no test, lint, typecheck, or build command ran after the last code edit \(src\/parser\.ts\)/);
    assert.equal(blocked(s.stop('All tests pass now.', { stop_hook_active: true })), null, 'never sends back twice for one stop');
    assert.equal(blocked(s.stop('Fixed the parser. NOT VERIFIED: the repository has no tests.')), null, 'an honest label is accepted');
    assert.equal(blocked(s.stop('I changed the parser; here is the diff.')), null, 'no success claim');
    s.post('Bash', { command: 'npm test' }, 'PostToolUseFailure');
    assert.match(blocked(s.stop('All tests pass now.')), /last check after the edit failed: `npm test`/);
    s.post('Bash', { command: 'npm test' });
    assert.equal(blocked(s.stop('All tests pass now.')), null, 'a passing check after the edit');
    assert.ok(s.lines().some((x) => x.kind === 'claim-check'), 'interventions are recorded');
    // turned off
    s.post('Edit', { file_path: path.join(s.proj, 'src', 'parser.ts') });
    fs.mkdirSync(path.join(s.proj, '.vz-skills'));
    fs.writeFileSync(path.join(s.proj, '.vz-skills', 'config.json'), JSON.stringify({ version: 1, hooks: { claim_check: false } }));
    assert.equal(blocked(s.stop('All tests pass.')), null);
    // malformed input fails open
    for (const input of ['', 'not json', JSON.stringify({ hook_event_name: 'PreToolUse' })]) {
      const m = runHook('claim-check.js', input, s.env);
      assert.equal(m.status, 0);
      assert.equal(m.stdout.trim(), '');
    }
  } finally { s.cleanup(); }
});

test('vz-ledger prints a per-session timeline, JSON, and the ledger path; rejects unknown options', () => {
  const s = sandbox();
  try {
    s.post('Edit', { file_path: path.join(s.proj, 'src', 'a.ts') });
    s.post('Bash', { command: 'npm test' });
    s.post('Edit', { file_path: path.join(s.proj, 'src', 'b.ts') }, 'PostToolUse', 's2');
    const cli = (args) => runNode(path.join(SCRIPTS, 'vz-ledger.js'), ['--project', s.proj, ...args], { env: s.env });
    let r = cli([]);
    assert.equal(r.status, 0);
    assert.match(r.stdout, /## Session s1/);
    assert.match(r.stdout, /1 files edited \(1 edits\), 1 commands, checks: 1 passed, 0 failed/);
    assert.match(r.stdout, /check ok `npm test`/);
    r = cli(['--last-session', '--format', 'json']);
    const j = JSON.parse(r.stdout);
    assert.equal(j.entries.length, 1);
    assert.equal(j.entries[0].session, 's2');
    assert.equal(cli(['--path']).stdout.trim(), s.ledgerFile());
    assert.equal(cli(['--bogus']).status, 2);
  } finally { s.cleanup(); }
});

test('dashboard: one self-contained page from the real state, with repository text escaped', () => {
  const s = sandbox();
  try {
    const p = s.proj;
    const evil = '<script>alert(1)</script><img src=x onerror=alert(2)>';
    fs.writeFileSync(path.join(p, 'package.json'), JSON.stringify({ name: 'x', scripts: { test: 'node --test' } }));
    fs.writeFileSync(path.join(p, 'README.md'), `# Demo ${evil}\n`);
    fs.mkdirSync(path.join(p, 'docs', 'adr'), { recursive: true });
    fs.writeFileSync(path.join(p, 'docs', 'adr', '0001-use-postgres.md'), '# 1. Use Postgres\n\nDate: 2026-10-01\nStatus: Accepted\n');
    fs.writeFileSync(path.join(p, 'docs', 'adr', '0002-queue.md'), `# 2. Queue ${evil}\n\nStatus: Proposed\n`);
    fs.mkdirSync(path.join(p, '.vz-skills'));
    fs.writeFileSync(path.join(p, '.vz-skills', 'checkpoint.md'), '# Checkpoint - Rate limiting\nSaved: 2026-10-17T10:00Z   Branch: main\n## Slices\nS1 limiter - TESTED\nS2 metrics - NOT VERIFIED\n## Next exact action\nWrite the metrics test in src/metrics.test.ts\n');
    git(p, ['init', '-q']); git(p, ['add', '-A']); git(p, ['commit', '-q', '-m', `feat: start ${evil}`]);
    s.post('Edit', { file_path: path.join(p, 'src', 'a.ts') });
    s.post('Bash', { command: 'npm test' }, 'PostToolUseFailure');
    const r = runNode(path.join(SCRIPTS, 'vz-dashboard.js'), ['--project', p], { env: s.env });
    assert.equal(r.status, 0, r.stderr);
    const html = fs.readFileSync(path.join(p, '.vz-skills', 'dashboard.html'), 'utf8');
    assert.doesNotMatch(html, /<script|<img/i, 'repository text cannot inject markup (only escaped text remains)');
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/, 'shown as text instead');
    assert.match(html, /Content-Security-Policy" content="default-src 'none'/);
    assert.doesNotMatch(html, /(src|href)="https?:/i, 'no network requests');
    for (const h of ['Current task', 'Settings', 'Stack and commands', 'Git', 'Architecture decisions', 'AI activity', 'Documentation']) assert.match(html, new RegExp(`<h2>${h}`), h);
    assert.match(html, /Rate limiting/);
    assert.match(html, /Write the metrics test in src\/metrics\.test\.ts/);
    assert.match(html, /Use Postgres[\s\S]*?Accepted/);
    assert.match(html, /\(1 proposed\)/);
    assert.match(html, /check failed/);
    const out = runNode(path.join(SCRIPTS, 'vz-dashboard.js'), ['--project', p, '--out', '-', '--no-git'], { env: s.env });
    assert.equal(out.status, 0);
    assert.match(out.stdout, /^<!doctype html>/);
    assert.equal(runNode(path.join(SCRIPTS, 'vz-dashboard.js'), ['--bogus']).status, 2);
  } finally { s.cleanup(); }
});

test('hooks resolve the project root, so a `cd` into a subfolder keeps one ledger', () => {
  const s = sandbox();
  try {
    fs.mkdirSync(path.join(s.proj, 'src'));
    s.post('Edit', { file_path: path.join(s.proj, 'src', 'a.ts') });
    runHook('ledger.js', { hook_event_name: 'PostToolUse', session_id: 's1', cwd: path.join(s.proj, 'src'), tool_name: 'Bash', tool_input: { command: 'npm test' } }, s.env);
    const e = s.lines();
    assert.equal(fs.readdirSync(path.join(s.home, 'ledger')).length, 1, 'one ledger file');
    assert.deepEqual(e.map((x) => x.file || x.command), ['src/a.ts', 'npm test']);
    const r = runHook('claim-check.js', { hook_event_name: 'Stop', session_id: 's1', cwd: path.join(s.proj, 'src'), last_assistant_message: 'All tests pass.' }, s.env);
    assert.equal(blocked(r), null, 'the test run from the subfolder counts');
  } finally { s.cleanup(); }
});
