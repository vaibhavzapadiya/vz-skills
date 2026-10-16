#!/usr/bin/env node
'use strict';
/**
 * PreToolUse guard for Bash / PowerShell commands.
 *
 * Decisions:
 *   deny  - catastrophic, irreversible, or clearly out-of-scope commands
 *   ask   - risky commands the user should confirm (destructive git, secret exposure,
 *           piping remote scripts into a shell, publishing/deploying, sudo, recursive deletes)
 *   (none) - everything else: no output, Claude Code's own permission rules decide
 *
 * Configuration (.vz-skills/config.json):
 *   hooks.command_guard: "on" | "off"  (off requires safety.acknowledged_overrides)
 *   approvals.destructive_git: "ask" | "refuse"   -> refuse turns ask into deny for destructive git
 *   approvals.external_actions: "ask" | "refuse"  -> refuse turns ask into deny for publish/deploy
 *   hooks.protected_paths: globs; rm/mv targeting them -> ask
 *
 * This hook is advisory and fails open (exit 0, no output) on malformed input.
 * It is not a security boundary. See docs/hooks.md and docs/security.md.
 */
const { readStdin, failOpen, emit, preToolDecision, projectRootFrom, loadConfig, globToRegExp } = require('../lib/hookio');

const CATASTROPHIC = [
  { re: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*|--recursive\s+--force|--force\s+--recursive)\s+(\/|\/\*|~|~\/|\$HOME|\$HOME\/|"\$HOME"|\.|\.\/|\*|\.\.)(\s|$|;|&|\|)/, why: 'recursive delete of the filesystem root, home, or the whole working directory' },
  { re: /\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(\/|~)(\s|$)/, why: 'recursive delete of root or home' },
  { re: /\bmkfs(\.\w+)?\b/, why: 'formats a filesystem' },
  { re: /\bdd\b[^\n]*\bof=\/dev\/(sd|hd|nvme|disk|mmcblk)/, why: 'raw write to a block device' },
  { re: />\s*\/dev\/(sd|hd|nvme|disk)/, why: 'redirect into a block device' },
  { re: /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/, why: 'fork bomb' },
  { re: /\bchmod\s+(-R\s+)?[0-7]*777\s+\/(\s|$)/, why: 'world-writable root' },
  { re: /\bformat\s+[a-zA-Z]:/i, why: 'formats a Windows drive' },
  { re: /Remove-Item\b[^\n]*-Recurse[^\n]*\s(["']?)([A-Za-z]:\\?|~|\$HOME|\$env:USERPROFILE|\/)\1(\s|$)/i, why: 'recursive delete of a drive root or home' },
  { re: /\brd\s+\/s\b[^\n]*\s[A-Za-z]:\\?(\s|$)/i, why: 'recursive delete of a drive root' },
  { re: /\bgit\s+push\b[^\n]*(--force|-f)\b[^\n]*\b(main|master|origin\s+main|origin\s+master)\b/, why: 'force-push to a primary branch' },
];

const RISKY = [
  { id: 'destructive-git', re: /\bgit\s+(reset\s+--hard|clean\s+-[a-zA-Z]*f|checkout\s+--\s+\.|checkout\s+\.|restore\s+(\.|--staged\s+\.|--worktree\s+\.)|stash\s+drop|stash\s+clear|branch\s+-D|push\b[^\n]*(--force|-f)\b|push\b[^\n]*--force-with-lease|rebase\s+-i|filter-branch|reflog\s+expire)/, why: 'destructive git operation that can discard uncommitted or committed work' },
  { id: 'recursive-delete', re: /\b(rm\s+-[a-zA-Z]*r|rmdir\s+\/s|Remove-Item\b[^\n]*-Recurse|del\s+\/[sq])/i, why: 'recursive delete' },
  { id: 'remote-script', re: /\b(curl|wget|Invoke-WebRequest|iwr|irm)\b[^\n]*\|\s*(sudo\s+)?(sh|bash|zsh|python[0-9.]*|node|pwsh|powershell|iex)\b/i, why: 'pipes a remote script into an interpreter' },
  { id: 'remote-script', re: /\biex\s*\(\s*(iwr|irm|Invoke-WebRequest|Invoke-RestMethod)/i, why: 'executes a downloaded script' },
  { id: 'sudo', re: /(^|\s|;|&&|\|\|)\s*sudo\s+/, why: 'elevated privileges' },
  { id: 'secrets', re: /\b(cat|type|less|more|head|tail|bat|Get-Content|gc)\s+[^\n|;&]*(\.env(\.[a-z]+)?|id_rsa|id_ed25519|\.pem|\.p12|\.pfx|credentials|\.netrc|\.npmrc|\.pypirc|secrets?\.(json|ya?ml|toml))(\s|$|;|&|\|)/i, why: 'reads a file that commonly contains secrets' },
  { id: 'secrets', re: /(^|\s|;|&&|\|\|)(printenv|env|set|Get-ChildItem\s+env:|dir\s+env:)(\s*$|\s*\||\s*;|\s*>)/i, why: 'dumps the whole environment, which may include secrets' },
  { id: 'secrets', re: /\becho\s+["']?\$\{?(AWS_SECRET|AWS_ACCESS|GITHUB_TOKEN|GH_TOKEN|NPM_TOKEN|ANTHROPIC_API_KEY|OPENAI_API_KEY|DATABASE_URL|[A-Z_]*(SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY)[A-Z_]*)\}?/i, why: 'prints a secret-looking environment variable' },
  { id: 'external', re: /\b(npm|pnpm|yarn)\s+publish\b|\bcargo\s+publish\b|\btwine\s+upload\b|\bgem\s+push\b|\bgh\s+(release\s+create|pr\s+merge|repo\s+delete)\b|\bdocker\s+push\b|\bkubectl\s+(delete|apply)\b|\bterraform\s+(apply|destroy)\b|\bpulumi\s+(up|destroy)\b|\bserverless\s+deploy\b|\bvercel\s+(--prod|deploy)\b|\bnetlify\s+deploy\b|\bfly\s+deploy\b|\bheroku\s+/, why: 'publishes, deploys, or deletes something outside this machine' },
  { id: 'database', re: /\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+\s*;)/i, why: 'destructive database statement' },
  { id: 'db-tool', re: /\b(prisma\s+(migrate\s+reset|db\s+push\s+--force-reset)|rails\s+db:(drop|reset)|alembic\s+downgrade\s+base|knex\s+migrate:rollback\s+--all|dotnet\s+ef\s+database\s+drop)/i, why: 'resets or drops a database' },
  { id: 'package-global', re: /\b(npm|pnpm|yarn)\s+(install|add|i)\s+(-g|--global)\b|\bpip\s+install\b[^\n]*--break-system-packages|\bchoco\s+install\b|\bbrew\s+install\b|\bapt(-get)?\s+install\b|\bwinget\s+install\b/i, why: 'installs software system-wide' },
];

function main() {
  const { data, error } = readStdin();
  if (error) return failOpen(error);
  if (data.hook_event_name && data.hook_event_name !== 'PreToolUse') return failOpen(`unexpected event ${data.hook_event_name}`);
  const cmd = data.tool_input && typeof data.tool_input.command === 'string' ? data.tool_input.command : null;
  if (cmd === null) return failOpen('no tool_input.command');
  const root = projectRootFrom(data);
  const cfg = loadConfig(root);
  const hooks = cfg ? cfg.effective.hooks : { command_guard: 'on', protected_paths: [] };
  const approvals = cfg ? cfg.effective.approvals : { destructive_git: 'ask', external_actions: 'ask' };
  if (hooks.command_guard === 'off') return process.exit(0);

  const flat = cmd.replace(/\\\r?\n/g, ' ');
  for (const c of CATASTROPHIC) {
    if (c.re.test(flat)) return emit(preToolDecision('deny', `vz-skills command guard: ${c.why}. If this is truly intended, run it yourself in a terminal.`));
  }
  const hits = [];
  for (const r of RISKY) if (r.re.test(flat) && !hits.some((h) => h.id === r.id)) hits.push(r);
  for (const g of hooks.protected_paths || []) {
    const re = globToRegExp(g.replace(/\/\*\*$/, ''));
    const tokens = flat.split(/\s+/).map((t) => t.replace(/^["']|["']$/g, '').replace(/\\/g, '/').replace(/^\.\//, ''));
    if (/\b(rm|mv|del|Remove-Item|Move-Item|git\s+rm)\b/i.test(flat) && tokens.some((t) => re.test(t) || t.startsWith(g.replace(/\/?\*\*$/, '') + '/'))) hits.push({ id: 'protected-path', why: `touches a protected path (${g}) from .vz-skills/config.json` });
  }
  if (!hits.length) return process.exit(0);

  let decision = 'ask';
  const reasons = hits.map((h) => h.why);
  if (hits.some((h) => h.id === 'destructive-git') && approvals.destructive_git === 'refuse') decision = 'deny';
  if (hits.some((h) => h.id === 'external') && approvals.external_actions === 'refuse') decision = 'deny';
  const reason = `vz-skills command guard: ${reasons.join('; ')}.${decision === 'deny' ? ' Refused by .vz-skills/config.json approvals policy.' : ' Confirm with the user before running.'}`;
  return emit(preToolDecision(decision, reason));
}

try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); }
