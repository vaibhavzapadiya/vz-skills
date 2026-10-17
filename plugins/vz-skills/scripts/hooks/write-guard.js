#!/usr/bin/env node
'use strict';
/**
 * PreToolUse guard for Write / Edit / MultiEdit / NotebookEdit.
 *
 * Decisions:
 *   deny - writes into .git/ internals, SSH/cloud credential stores, or OS system directories
 *   ask  - writes outside the project root (symlinks and junctions resolved); to secret-bearing files
 *          (.env, *.pem, *.key, ...); to local agent instructions or code that Claude Code runs
 *          (CLAUDE.md, AGENTS.md, .claude/ settings, rules, agents, commands, skills, hooks, .mcp.json)
 *          or VZ config; to shell startup files in the home directory; to lockfiles; to configured
 *          protected_paths; or content that looks like a credential; input too large to inspect
 *   (none) - everything else
 *
 * Path comparisons ignore case on Windows and macOS, whose default filesystems do.
 * Advisory, fail-open. Not a security boundary. See docs/hooks.md.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { readStdin, failOpen, emit, preToolDecision, projectRootFrom, loadConfig, globMatch, toPosix, relativeToRoot } = require('../lib/hookio');

// Provider token formats are case-sensitive and must start at a word boundary
// ("task-management-..." must not look like an "sk-" key).
const SECRET_TOKEN = /(?<![A-Za-z0-9_-])(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|glpat-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-(proj-|ant-)?[A-Za-z0-9_-]{30,}|sk_live_[A-Za-z0-9]{20,}|npm_[A-Za-z0-9]{36}|AIza[0-9A-Za-z_-]{30,})|-----BEGIN (RSA |EC |OPENSSH |DSA |PGP |ENCRYPTED )?PRIVATE KEY-----/;
// key = "value" assignments, quoted or JSON-style, and unquoted SECRET=value lines
const SECRET_ASSIGN = /["']?\b(password|passwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|token)["']?\s*[:=]\s*["'][^"'\s]{16,}["']|^\s*(export\s+)?[A-Z_]*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)[A-Z_]*\s*=\s*[^\s"'$]{12,}\s*$/im;
const CASE_INSENSITIVE_FS = process.platform === 'win32' || process.platform === 'darwin';

/** Resolve symlinks and junctions in the deepest existing ancestor, so a link cannot hide where a write lands. */
function realTarget(abs) {
  let dir = abs;
  const rest = [];
  for (let i = 0; i < 64 && !fs.existsSync(dir); i++) { rest.unshift(path.basename(dir)); const up = path.dirname(dir); if (up === dir) break; dir = up; }
  try { return path.join(fs.realpathSync.native(dir), ...rest); } catch { return abs; }
}
const PLACEHOLDER = /(example|placeholder|changeme|your[_-]?(key|token|secret)|xxxx|<[^>]+>|\$\{[^}]+\}|process\.env|os\.environ|dummy|fake|test[_-]?(key|token))/i;

function main() {
  const { data, error, tooLarge } = readStdin();
  if (tooLarge) return emit(preToolDecision('ask', 'vz-skills write guard: the write is too large to inspect. Confirm with the user before writing.'));
  if (error) return failOpen(error);
  if (data.hook_event_name && data.hook_event_name !== 'PreToolUse') return failOpen(`unexpected event ${data.hook_event_name}`);
  const ti = data.tool_input || {};
  const file = typeof ti.file_path === 'string' ? ti.file_path : typeof ti.notebook_path === 'string' ? ti.notebook_path : null;
  if (!file) return failOpen('no tool_input.file_path');
  const root = projectRootFrom(data);
  const cfg = loadConfig(root);
  const hooks = cfg ? cfg.effective.hooks : { write_guard: 'on', protected_paths: [] };
  if (hooks.write_guard === 'off') return process.exit(0);

  const { abs, rel } = relativeToRoot(root, file);
  // Judge the real location: a symlink or junction inside the project may point anywhere.
  const realAbs = realTarget(abs);
  const realRoot = realTarget(path.resolve(root));
  const realRel = path.relative(realRoot, realAbs);
  const outside = realRel.startsWith('..') || path.isAbsolute(realRel);
  const p = toPosix(realAbs).toLowerCase();
  const home = toPosix(realTarget(os.homedir())).toLowerCase();
  const inHome = (sub) => p === home + '/' + sub || p.startsWith(home + '/' + sub + '/');
  const base = path.basename(p);
  const relCmp = CASE_INSENSITIVE_FS ? toPosix(rel).toLowerCase() : toPosix(rel);

  // deny
  if (/(^|\/)\.git\/(?!hooks\/|info\/exclude)/i.test(relCmp) || /\/\.git\/(objects|refs|hooks|index|config|head|packed-refs|fetch_head|orig_head|info\/attributes|modules)/.test(p)) return emit(preToolDecision('deny', 'vz-skills write guard: writing inside .git/ internals is refused; use git commands instead.'));
  if (['.ssh', '.aws', '.gnupg', '.kube', '.docker', '.config/gh', '.azure', '.config/gcloud'].some(inHome) || ['.netrc', '.npmrc', '.pypirc', '.git-credentials'].some((n) => p === home + '/' + n)) return emit(preToolDecision('deny', 'vz-skills write guard: refusing to write a credential store in the home directory.'));
  if (/^\/(etc|usr|bin|sbin|boot|lib|lib64|sys|proc|dev)\//.test(p) || /^[a-z]:\/(windows|program files|program files \(x86\)|programdata)\//.test(p)) return emit(preToolDecision('deny', 'vz-skills write guard: refusing to write into an operating-system directory.'));
  if (p === home + '/.claude.json' || (p.startsWith(home + '/.claude/') && /\/settings(\.local)?\.json$/.test(p))) return emit(preToolDecision('deny', 'vz-skills write guard: Claude Code user settings are the user\'s to edit; refusing to modify them from a hook-guarded write.'));

  // ask
  const reasons = [];
  if (outside) reasons.push(`path is outside the project root (${root})`);
  if (inHome('.claude') || ['.bashrc', '.bash_profile', '.zshrc', '.zprofile', '.profile', '.config/fish/config.fish'].some((n) => p === home + '/' + n) || inHome('documents/powershell') || inHome('documents/windowspowershell')) reasons.push('modifies your Claude Code configuration or a shell startup file, which runs code in every session');
  if ((/^\.env(\..+)?$/.test(base) || /\.env$/.test(base) || base === '.envrc') && !/\.(example|sample|template|dist)$/.test(base)) reasons.push('.env files hold secrets');
  if (/\.(pem|key|p12|pfx|jks|keystore|crt|cer)$/.test(base) || /^id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/.test(base) || /(^|\/)(secrets?|credentials?)\.(json|ya?ml|toml|txt|env)$/.test(p)) reasons.push('file name suggests credentials');
  if (/(^|\/)(claude\.md|claude\.local\.md|agents\.md|gemini\.md|\.cursorrules|\.mcp\.json)$/.test(p) || /(^|\/)\.claude\/(settings(\.local)?\.json|claude\.md|(rules|agents|commands|skills|hooks|output-styles)\/)/.test(p)) reasons.push('modifies local agent instructions, settings, or code Claude Code runs; confirm the user wants that');
  if (/(^|\/)\.vz-skills\/config\.json$/.test(p)) reasons.push('modifies the VZ Skills safety/rigor configuration');
  if (/^(package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|poetry\.lock|uv\.lock|pipfile\.lock|cargo\.lock|go\.sum|gemfile\.lock|composer\.lock|packages\.lock\.json)$/.test(base)) reasons.push('lockfiles should be regenerated by the package manager, not hand-edited');
  for (const g of hooks.protected_paths || []) { if (globMatch(CASE_INSENSITIVE_FS ? g.toLowerCase() : g, relCmp)) { reasons.push(`matches protected path "${g}" from .vz-skills/config.json`); break; } }
  const content = [ti.content, ti.new_string, ti.new_source, ...(Array.isArray(ti.edits) ? ti.edits.map((e) => e && e.new_string) : [])].filter((s) => typeof s === 'string').join('\n');
  const secret = content && (content.match(SECRET_TOKEN) || content.match(SECRET_ASSIGN));
  if (secret) {
    const m = secret[0];
    const relLower = toPosix(rel).toLowerCase();
    const isTestArtifact = /(^|\/)(tests?|__tests__|fixtures?|__fixtures__|__mocks__|specs?|testdata)\//.test(relLower) || /\.(test|spec)\.[a-z]+$/.test(relLower);
    if (!PLACEHOLDER.test(m) && !/\.(example|sample|template|dist)$/.test(base) && !isTestArtifact) reasons.push('content contains a credential-looking value; secrets must not be written into the repository');
  }
  if (!reasons.length) return process.exit(0);
  return emit(preToolDecision('ask', `vz-skills write guard: ${reasons.join('; ')}. Confirm with the user before writing.`));
}

try { main(); } catch (e) { failOpen(`internal error: ${e.message}`); }
