# Hooks

VZ Skills ships three hooks, declared in `plugins/vz-skills/hooks/hooks.json` using the schema from the official hooks reference (accessed 2026-10-16). They are implemented as dependency-free Node scripts under `scripts/hooks/` and run in **exec form** (`"command": "node", "args": [...]`) so no shell quoting is involved on any platform.

**They are advisory.** A hook can ask, deny, or stay silent; Claude Code's permission system and sandbox remain the enforcement boundary. A hook that crashes, times out, or receives malformed input makes **no decision** (exit 0, nothing on stdout, a one-line note on stderr). This is deliberate (DEC-012): a guard must not break every command when something unexpected happens, and the platform does not block on timeouts by default on this CLI version anyway.

| Event | Matcher | Script | Timeout | What it does |
|---|---|---|---|---|
| `PreToolUse` | `Bash\|PowerShell` | `command-guard.js` | 10 s | `deny` catastrophic commands; `ask` for risky ones; silent otherwise |
| `PreToolUse` | `Write\|Edit\|MultiEdit\|NotebookEdit` | `write-guard.js` | 10 s | `deny` writes into `.git/` internals, home credential stores, OS dirs, user Claude settings; `ask` for secrets files, local instructions, VZ config, lockfiles, paths outside the project, `hooks.protected_paths`, and credential-looking content |
| `SessionStart` | `startup\|resume\|clear\|compact` | `session-context.js` | 20 s | injects `additionalContext`: the core policy, the effective profile summary, and a brief discovery (depth 3, no tool probing), capped at 9,000 characters |

Plugin hooks fire in every session where the plugin is enabled, for every matching tool call, whether or not a VZ skill is in use. Measured latency in `tests/hooks.test.js` is well under the 2.5 s budget the test enforces (typically 100-300 ms per call on the build machine, dominated by Node start-up).

## Command guard decisions

Deny (irreversible or out of scope): `rm -rf /`, `rm -rf ~`, `rm -rf .`, `rm -rf *`, `mkfs`, `dd of=/dev/sd*`, fork bombs, `chmod -R 777 /`, `format c:`, `Remove-Item -Recurse` on a drive root or home, `git push --force` to `main`/`master`.

Ask (confirm with the user): destructive git (`reset --hard`, `clean -f`, `checkout -- .`, `stash drop`, `branch -D`, force pushes to other branches, `rebase -i`, `filter-branch`), recursive deletes, piping remote scripts into an interpreter, `sudo`, reading secret-bearing files (`.env`, `id_rsa`, `*.pem`, `credentials`, ...), dumping the environment, echoing secret-looking variables, publishing/deploying (`npm publish`, `terraform apply`, `kubectl delete`, `gh release create`, ...), destructive SQL and ORM resets, global package installs, and `rm`/`mv` on `hooks.protected_paths`.

Configuration: `hooks.command_guard: off` (needs an acknowledged override) silences the guard; `approvals.destructive_git: refuse` and `approvals.external_actions: refuse` turn the corresponding asks into denies.

## Write guard decisions

See the table above. Content checks apply to `content`, `new_string`, and `MultiEdit` edits; recognised credential shapes (AWS keys, GitHub tokens, Slack tokens, private key blocks, `password = "..."` style literals) trigger an ask unless the value is an obvious placeholder or the file lives under a test/fixture/mock directory. `.env.example` and similar templates are exempt from the file-name rule.

## Session context

Output shape: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}`. Disable with `hooks.session_context: false`. The discovery brief is the same engine as `/vz-skills:discover` with a shallower scan.

## Disabling

- Per project: set the `hooks.*` keys (guards need an acknowledged override; the session brief does not).
- Everything, platform-wide: Claude Code's `"disableAllHooks": true` setting (documented by Claude Code; VZ never writes it). There is no per-hook switch at the platform level.
- Removing the plugin removes its hooks.

## What the hooks do not do

- They do not inspect command *semantics*; a script named `npm test` that deletes files is not caught by the guard (the discovery baseline runner has the same limitation and says so).
- They do not see `@file` mentions, which Claude Code inserts without a tool call.
- They do not replace code review or sandboxing, and `claude plugin eval` treats plugin hooks as code running outside the sandbox.

## Testing

`npm run test:hooks` exercises: normal pass-through, every deny and ask category, PowerShell input, `refuse` approvals, protected paths, acknowledged and unacknowledged `off`, malformed/empty/wrong-event input for all three hooks (fail-open), broken project config, write-guard deny/ask/content/placeholder/fixture cases, session output shape and size cap, idempotency, and latency.
