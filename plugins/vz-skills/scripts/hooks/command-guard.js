#!/usr/bin/env node
'use strict';
/**
 * PreToolUse guard for Bash / PowerShell commands.
 *
 * Decisions:
 *   deny  - catastrophic, irreversible, or clearly out-of-scope commands
 *   ask   - risky commands the user should confirm (destructive git, secret exposure,
 *           piping remote scripts into a shell, pushing/publishing/deploying, sudo, recursive deletes)
 *   (none) - everything else: no output, Claude Code's own permission rules decide
 *
 * How commands are read: the command line is split into simple commands at ; && || | & newlines,
 * parentheses, braces, $( ) and (in Bash) backticks, outside quotes; quotes and escapes follow the
 * tool's shell (backslash in Bash, backtick in PowerShell). Each simple command is tokenized with
 * quotes removed, leading wrappers (sudo, env assignments, nohup, ...) are skipped, and rm / Remove-Item,
 * find, and git are judged from their real flags and arguments, so flag order, quoting and subshells
 * do not change the outcome. Text inside quotes is not treated as a command (a commit message that
 * mentions "git push --force" is just text), except the argument of `bash -c`, `pwsh -Command`,
 * `eval`, and `iex`, which is analyzed as a command line of its own.
 *
 * Configuration (.vz-skills/config.json):
 *   hooks.command_guard: "on" | "off"  (off requires safety.acknowledged_overrides in the user config)
 *   approvals.destructive_git: "ask" | "refuse"   -> refuse turns ask into deny for destructive git
 *   approvals.external_actions: "ask" | "refuse"  -> refuse turns ask into deny for push/publish/deploy
 *   hooks.protected_paths: globs; rm/mv targeting them -> ask
 *
 * This hook is advisory and fails open (exit 0, no output) on malformed input; input too large to
 * inspect gets "ask". It is not a security boundary. See docs/hooks.md and docs/security.md.
 */
const { readStdin, failOpen, emit, preToolDecision, projectRootFrom, loadConfig, globMatch } = require('../lib/hookio');

// Commands longer than this are not pattern-matched (bounded regex time); they get "ask".
const MAX_COMMAND = 32 * 1024;

// Whole-line patterns for things that are catastrophic wherever they appear.
const CATASTROPHIC_LINE = [
  { re: /\bmkfs(\.\w+)?\b/, why: 'formats a filesystem' },
  { re: /\bdd\b[^\n]*\bof=\/dev\/(sd|hd|nvme|disk|mmcblk)/, why: 'raw write to a block device' },
  { re: />\s*\/dev\/(sd|hd|nvme|disk)/, why: 'redirect into a block device' },
  { re: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, why: 'fork bomb' },
  { re: /\bchmod\s+(-R\s+)?[0-7]*777\s+\/(\s|$)/, why: 'world-writable root' },
];

// Whole-line patterns for risky things that do not need command structure. Those marked
// `quoted: true` must also see inside quotes (SQL passed to psql -c, a script passed to bash -c);
// the others look at the line with multi-word quoted text (commit messages, echo strings) blanked.
const RISKY_LINE = [
  { id: 'remote-script', quoted: true, re: /\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|irm)\b[^\n]*\|\s*(sudo\s+)?(\S*\/)?(sh|bash|zsh|dash|ksh|python[0-9.]*|node|pwsh|powershell|iex|Invoke-Expression)\b/i, why: 'pipes a remote script into an interpreter' },
  { id: 'remote-script', quoted: true, re: /\b(sh|bash|zsh|source)\s+<\(\s*(curl|wget)\b/i, why: 'runs a downloaded script' },
  { id: 'remote-script', quoted: true, re: /\b(sh|bash|zsh)\s+-c\s+["']?\$\(\s*(curl|wget)\b/i, why: 'runs a downloaded script' },
  { id: 'remote-script', quoted: true, re: /\b(iex|Invoke-Expression)\b[^\n]*\b(iwr|irm|Invoke-WebRequest|Invoke-RestMethod|DownloadString|Net\.WebClient)\b/i, why: 'executes a downloaded script' },
  { id: 'sudo', re: /(^|[\s;&|(])sudo\s+/, why: 'elevated privileges' },
  { id: 'secrets', re: /\b(cat|type|less|more|head|tail|bat|Get-Content|gc|grep|rg|findstr|Select-String|sls|strings|sed|awk)\s+[^\n|;&]*(?<![\w.-])(\.env(\.(?!example\b|sample\b|template\b|dist\b)[a-z]+)?|\.envrc|id_rsa|id_ed25519|\.pem|\.p12|\.pfx|credentials|\.netrc|\.npmrc|\.pypirc|\.git-credentials|secrets?\.(json|ya?ml|toml))(?![\w.-])/i, why: 'reads a file that commonly contains secrets' },
  { id: 'secrets', re: /(^|\s|;|&&|\|\|)(printenv|env|set|Get-ChildItem\s+env:|gci\s+env:|dir\s+env:)(\s*$|\s*\||\s*;|\s*>)/i, why: 'dumps the whole environment, which may include secrets' },
  { id: 'secrets', re: /\becho\s+["']?\$\{?(AWS_SECRET|AWS_ACCESS|GITHUB_TOKEN|GH_TOKEN|NPM_TOKEN|ANTHROPIC_API_KEY|OPENAI_API_KEY|DATABASE_URL|[A-Z_]*(SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)[A-Z_]*)\}?/i, why: 'prints a secret-looking environment variable' },
  { id: 'external', re: /\b(npm|pnpm|yarn)\s+publish\b|\bcargo\s+publish\b|\btwine\s+upload\b|\bgem\s+push\b|\bgh\s+(release\s+(create|delete|edit|upload)|pr\s+(create|merge|close|comment|edit|review)|issue\s+(create|close|comment|edit)|repo\s+(delete|create|edit))\b|\bdocker\s+push\b|\bterraform\s+(apply|destroy)\b|\bpulumi\s+(up|destroy)\b|\bserverless\s+deploy\b|\bvercel\s+(--prod|deploy)\b|\bnetlify\s+deploy\b|\bfly\s+deploy\b|\bheroku\s+(container:release|releases:rollback|apps:destroy|pg:reset|config:(set|unset)|run)\b/i, why: 'publishes, deploys, or deletes something outside this machine' },
  { id: 'external', re: /\bkubectl\s+(delete|apply|replace|scale|rollout|drain|patch)\b(?![^\n]*--dry-run)/i, why: 'publishes, deploys, or deletes something outside this machine' },
  { id: 'external', re: /\b(npm|pnpm|yarn)\s+version\s+(?![^\n]*--no-git-tag-version)\S/i, why: 'creates a version commit and tag' },
  { id: 'database', quoted: true, re: /\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+(TABLE\s+)?\w|ALTER\s+TABLE\s+\S+\s+DROP\b|DELETE\s+FROM\s+[\w."`[\]]+\s*(;|$|["']))/i, why: 'destructive database statement' },
  { id: 'db-tool', quoted: true, re: /\b(prisma\s+(migrate\s+reset|db\s+push\s+--force-reset)|rails\s+db:(drop|reset)|alembic\s+downgrade\s+base|knex\s+migrate:rollback\s+--all|dotnet\s+ef\s+database\s+drop)/i, why: 'resets or drops a database' },
  { id: 'package-global', re: /\b(npm|pnpm|yarn)\s+(install|add|i)\s+(-g|--global)\b|\bpip\s+install\b[^\n]*--break-system-packages|\bchoco\s+install\b|\bbrew\s+install\b|\bapt(-get)?\s+install\b|\bwinget\s+install\b/i, why: 'installs software system-wide' },
];

// ---------- command-line structure ----------

// Inside double quotes, Bash treats a backslash as an escape only before these characters
// (so "C:\Users\me" keeps its backslashes); PowerShell's escape character is the backtick.
const BASH_DQ_ESCAPABLE = '"\\$`';
const isEscape = (ps, c, next) => (ps ? c === '`' : c === '\\' && BASH_DQ_ESCAPABLE.includes(next));

/** Split a command line into simple-command strings at shell separators outside quotes. */
function splitCommands(line, ps = false) {
  const out = [];
  let cur = '';
  let q = null;
  const separators = ps ? ';&|\n\r(){}' : ';&|\n\r(){}`';
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      cur += c;
      if (q === '"' && i + 1 < line.length && isEscape(ps, c, line[i + 1])) { cur += line[++i]; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '$' && line[i + 1] === '{') { const end = line.indexOf('}', i); if (end !== -1) { cur += line.slice(i, end + 1); i = end; continue; } }
    if (c === '$' && line[i + 1] === '(') { out.push(cur); cur = ''; i++; continue; }
    if (separators.includes(c)) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** Tokenize one simple command; quotes are removed, quoted text stays one token. */
function tokenize(cmd, ps = false) {
  const toks = [];
  let cur = '';
  let q = null;
  let has = false;
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i];
    if (q) {
      if (q === '"' && i + 1 < cmd.length && isEscape(ps, c, cmd[i + 1])) { cur += cmd[++i]; continue; }
      if (c === q) { q = null; continue; }
      cur += c;
      continue;
    }
    if (c === '"' || c === "'") { q = c; has = true; continue; }
    if (/\s/.test(c)) { if (has || cur) toks.push(cur); cur = ''; has = false; continue; }
    cur += c; has = true;
  }
  if (has || cur) toks.push(cur);
  return toks;
}

const WRAPPERS = new Set(['sudo', 'doas', 'command', 'exec', 'nohup', 'time', 'nice', 'env', 'xargs', 'builtin', '&', '.', 'call']);

/** Drop env assignments and wrapper commands (with their flags) from the front of a token list. */
function stripWrappers(toks) {
  let i = 0;
  while (i < toks.length) {
    const t = toks[i];
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) { i++; continue; }
    if (WRAPPERS.has(t.toLowerCase())) { i++; while (i < toks.length && /^-/.test(toks[i])) i++; continue; }
    break;
  }
  return toks.slice(i);
}

/** Every simple command in a line, including command strings passed to bash -c, pwsh -Command, eval, iex. */
function simpleCommands(line, depth = 0, ps = false) {
  const result = [];
  for (const seg of splitCommands(line, ps)) {
    const toks = stripWrappers(tokenize(seg, ps));
    if (!toks.length) continue;
    result.push(toks);
    if (depth < 3) {
      const name = baseName(toks[0]);
      for (let i = 1; i < toks.length; i++) {
        const flag = toks[i].toLowerCase();
        const takesScript = (['sh', 'bash', 'zsh', 'dash', 'ksh'].includes(name) && flag === '-c') || (['pwsh', 'powershell'].includes(name) && /^-c(ommand)?$/.test(flag)) || (name === 'cmd' && flag === '/c');
        if (takesScript && toks[i + 1]) result.push(...simpleCommands(toks[i + 1], depth + 1, ['pwsh', 'powershell'].includes(name)));
      }
      if (['eval', 'iex', 'invoke-expression'].includes(name) && toks.length > 1) result.push(...simpleCommands(toks.slice(1).join(' '), depth + 1, name !== 'eval'));
    }
  }
  return result;
}

function baseName(t) { return String(t).replace(/\\/g, '/').split('/').pop().toLowerCase().replace(/\.exe$/, ''); }

// ---------- judgements on one simple command ----------

/** What a deletion target would destroy, or null when it is an ordinary path. */
function catastrophicTarget(t) {
  let x = String(t).replace(/\\/g, '/');
  if (x === '*' || x === './*' || x === '.' || x === './') return 'the whole working directory';
  x = x.replace(/\/\*$/, '/');
  if (/^(\.\.\/?)+$/.test(x)) return 'a parent directory';
  if (x === '/') return 'the filesystem root';
  if (/^(~|\$HOME|\$\{HOME\}|\$env:USERPROFILE|\$env:HOME|%USERPROFILE%|%HOMEPATH%)\/?$/i.test(x)) return 'the home directory';
  if (/^[A-Za-z]:\/?$/.test(x) || /^\/(mnt\/)?[a-z]\/?$/.test(x)) return 'a drive root';
  if (/^\/(bin|boot|dev|etc|home|lib|lib64|opt|proc|root|sbin|srv|sys|usr|var|System|Library|Users|Applications)\/?$/.test(x)) return 'a system directory';
  if (/^[A-Za-z]:\/(Windows|Program Files|Program Files \(x86\)|Users|ProgramData)\/?$/i.test(x)) return 'a system directory';
  return null;
}

const DELETE_COMMANDS = new Set(['rm', 'remove-item', 'ri', 'del', 'erase', 'rd', 'rmdir']);

function judgeDelete(toks) {
  const name = baseName(toks[0]);
  if (!DELETE_COMMANDS.has(name)) return null;
  const args = toks.slice(1);
  let recursive = false;
  let endOfFlags = false;
  const targets = [];
  for (const a of args) {
    if (!endOfFlags && a === '--') { endOfFlags = true; continue; }
    if (!endOfFlags && /^--?[A-Za-z]/.test(a)) {
      const low = a.toLowerCase();
      if (low === '--recursive' || /^-r(e(c(u(r(s(e)?)?)?)?)?)?$/.test(low)) recursive = true;
      // a POSIX short-flag group such as -rf or -Rfv (only rm's own letters, so PowerShell's -Force is not one)
      else if (name === 'rm' && /^-[rRfivdIP]+$/.test(a) && /r/i.test(a)) recursive = true;
      if (low === '--no-preserve-root') return { id: 'deny', why: 'recursive delete with --no-preserve-root' };
      continue;
    }
    if (!endOfFlags && /^\/[sq]$/i.test(a) && ['rd', 'rmdir', 'del', 'erase'].includes(name)) { if (/^\/s$/i.test(a)) recursive = true; continue; }
    targets.push(a);
  }
  if (!recursive) return null;
  for (const t of targets) {
    const what = catastrophicTarget(t);
    if (what) return { id: 'deny', why: `recursive delete of ${what}` };
  }
  return { id: 'recursive-delete', why: 'recursive delete', targets };
}

// find options that do not narrow which files match
const FIND_UNFILTERED = new Set(['-delete', '-depth', '-maxdepth', '-mindepth', '-xdev', '-mount', '-L', '-P', '-H', '-print', '-exec', '-execdir', '-ok', '-okdir', '-follow', '-noleaf']);

function judgeFind(toks) {
  if (baseName(toks[0]) !== 'find' || toks.length < 2) return null;
  const deletes = toks.includes('-delete') || toks.some((t, i) => /^-(exec|execdir|ok|okdir)$/.test(t) && /^(rm|shred)$/.test(baseName(toks[i + 1] || '')));
  if (!deletes) return null;
  const execAt = toks.findIndex((t) => /^-(exec|execdir|ok|okdir)$/.test(t));
  const preds = toks.slice(2, execAt === -1 ? undefined : execAt).filter((t) => t.startsWith('-') && !FIND_UNFILTERED.has(t));
  const what = catastrophicTarget(toks[1]);
  // "find . -name '*.tmp' -delete" is everyday cleanup (ask); "find / -delete" with no filter deletes everything
  return what && !preds.length ? { id: 'deny', why: `find that deletes everything under ${what}` } : { id: 'recursive-delete', why: 'recursive delete' };
}

/** The line with multi-word quoted strings blanked: prose in quotes (messages, echo text) is not a command. */
function withoutQuotedProse(line) {
  return line.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, (m) => (/\s/.test(m) ? '""' : m));
}

function judgeFormat(toks) {
  return baseName(toks[0]) === 'format' && toks.slice(1).some((t) => /^[A-Za-z]:\\?$/.test(t)) ? { id: 'deny', why: 'formats a Windows drive' } : null;
}

const PRIMARY = /^(refs\/heads\/)?(main|master)$/;

function judgeGit(toks) {
  if (baseName(toks[0]) !== 'git') return [];
  // skip git's global options: -C <dir>, -c <k=v>, --git-dir=..., --no-pager, ...
  let i = 1;
  while (i < toks.length && toks[i].startsWith('-')) { if (toks[i] === '-C' || toks[i] === '-c') i++; i++; }
  const sub = toks[i];
  const rest = toks.slice(i + 1);
  const flags = rest.filter((t) => t.startsWith('-'));
  const shortHas = (ch) => flags.some((f) => /^-[a-zA-Z]+$/.test(f) && f.includes(ch));
  const out = [];
  const destructive = () => out.push({ id: 'destructive-git', why: 'destructive git operation that can discard uncommitted or committed work' });
  // the project's pre-commit / commit-msg / pre-push hooks are often its lint and secret checks
  if (['commit', 'push', 'merge', 'am', 'rebase', 'cherry-pick', 'revert'].includes(sub) && (flags.includes('--no-verify') || (sub === 'commit' && shortHas('n')))) out.push({ id: 'hook-bypass', why: "skips the repository's git hooks (--no-verify)" });
  switch (sub) {
    case 'push': {
      const positional = rest.filter((t) => !t.startsWith('-'));
      const refspecs = positional.slice(1);
      const force = flags.some((f) => /^--force(-with-lease|-if-includes)?(=|$)/.test(f)) || shortHas('f') || refspecs.some((r) => r.startsWith('+'));
      const del = flags.includes('--delete') || shortHas('d') || refspecs.some((r) => r.startsWith(':'));
      const hitsPrimary = refspecs.some((r) => PRIMARY.test(r.replace(/^[+:]/, '').split(':').pop()));
      if ((force || del) && hitsPrimary) out.push({ id: 'deny', why: del ? 'deletes a primary branch on the remote' : 'force-push to a primary branch' });
      else if (force || del || flags.includes('--mirror')) destructive();
      out.push({ id: 'external', why: 'pushes to a remote repository' });
      break;
    }
    case 'reset': if (flags.includes('--hard') || flags.includes('--merge') || flags.includes('--keep')) destructive(); break;
    case 'clean': if (flags.includes('--force') || shortHas('f')) destructive(); break;
    case 'checkout': if (rest.includes('--') || rest.includes('.') || flags.includes('--force') || shortHas('f')) destructive(); break;
    case 'restore': if (!(flags.includes('--staged') || flags.includes('-S')) || flags.includes('--worktree') || flags.includes('-W')) { if (rest.some((t) => !t.startsWith('-'))) destructive(); } break;
    case 'stash': if (['drop', 'clear'].includes(rest[0])) destructive(); break;
    case 'branch': if (flags.includes('-D') || ((flags.includes('--delete') || shortHas('d')) && (flags.includes('--force') || shortHas('f')))) destructive(); break;
    case 'rebase': if (flags.includes('-i') || flags.includes('--interactive')) destructive(); break;
    case 'filter-branch': case 'filter-repo': destructive(); break;
    case 'reflog': if (rest[0] === 'expire') destructive(); break;
    case 'tag': {
      const listing = rest.length === 0 || flags.some((f) => /^(-l|--list|-n\d*|--contains|--no-contains|--merged|--no-merged|--points-at|-v|--verify|--sort|--format)/.test(f));
      if (!listing) out.push({ id: 'external', why: 'creates or deletes a release tag' });
      break;
    }
    default: break;
  }
  return out;
}

// ---------- main ----------

function decide(cmd, hooks, approvals, { powershell = false } = {}) {
  const flat = powershell ? cmd.replace(/`\r?\n/g, ' ') : cmd.replace(/\\\r?\n/g, ' ');
  for (const c of CATASTROPHIC_LINE) if (c.re.test(flat)) return { decision: 'deny', why: c.why };

  const hits = [];
  const add = (h) => { if (!hits.some((x) => x.id === h.id)) hits.push(h); };
  const deleteTargets = [];
  for (const toks of simpleCommands(flat, 0, powershell)) {
    for (const j of [judgeDelete(toks), judgeFind(toks), judgeFormat(toks), ...judgeGit(toks)]) {
      if (!j) continue;
      if (j.id === 'deny') return { decision: 'deny', why: j.why };
      add(j);
      if (j.targets) deleteTargets.push(...j.targets);
    }
    if (DELETE_COMMANDS.has(baseName(toks[0])) || ['mv', 'move-item', 'move', 'mi'].includes(baseName(toks[0])) || (baseName(toks[0]) === 'git' && toks.includes('rm'))) deleteTargets.push(...toks.slice(1).filter((t) => !t.startsWith('-')));
  }
  const prose = withoutQuotedProse(flat);
  for (const r of RISKY_LINE) if (r.re.test(r.quoted ? flat : prose)) add(r);
  for (const g of hooks.protected_paths || []) {
    const base = g.replace(/\/?\*\*$/, '');
    const norm = (t) => t.replace(/\\/g, '/').replace(/^\.\//, '');
    if (deleteTargets.map(norm).some((t) => globMatch(g, t) || globMatch(base, t) || t.startsWith(base + '/'))) add({ id: 'protected-path', why: `touches a protected path (${g}) from .vz-skills/config.json` });
  }
  if (!hits.length) return null;

  const refused = (hits.some((h) => h.id === 'destructive-git') && approvals.destructive_git === 'refuse') || (hits.some((h) => h.id === 'external') && approvals.external_actions === 'refuse');
  return { decision: refused ? 'deny' : 'ask', policy: refused, why: hits.map((h) => h.why).join('; ') };
}

function main() {
  const { data, error, tooLarge } = readStdin();
  if (tooLarge) return emit(preToolDecision('ask', 'vz-skills command guard: the command is too large to inspect. Confirm with the user before running.'));
  if (error) return failOpen(error);
  if (data.hook_event_name && data.hook_event_name !== 'PreToolUse') return failOpen(`unexpected event ${data.hook_event_name}`);
  const cmd = data.tool_input && typeof data.tool_input.command === 'string' ? data.tool_input.command : null;
  if (cmd === null) return failOpen('no tool_input.command');
  const root = projectRootFrom(data);
  const cfg = loadConfig(root);
  const hooks = cfg ? cfg.effective.hooks : { command_guard: 'on', protected_paths: [] };
  const approvals = cfg ? cfg.effective.approvals : { destructive_git: 'ask', external_actions: 'ask' };
  if (hooks.command_guard === 'off') return process.exit(0);
  if (cmd.length > MAX_COMMAND) return emit(preToolDecision('ask', 'vz-skills command guard: the command is too long to inspect. Confirm with the user before running.'));

  const d = decide(cmd, hooks, approvals, { powershell: data.tool_name === 'PowerShell' });
  if (!d) return process.exit(0);
  const tail = d.decision === 'ask' ? ' Confirm with the user before running.'
    : d.policy ? ' Refused by .vz-skills/config.json approvals policy.'
      : ' If this is truly intended, run it yourself in a terminal.';
  return emit(preToolDecision(d.decision, `vz-skills command guard: ${d.why}.${tail}`));
}

if (require.main === module) { try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); } }

module.exports = { decide, simpleCommands, splitCommands, tokenize, catastrophicTarget };
