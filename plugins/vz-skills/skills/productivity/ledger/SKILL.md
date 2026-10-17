---
name: ledger
description: Show what Claude actually edited and ran in this project, and which checks passed or failed, from the activity ledger the plugin records. Use for "what did you change or run", a session audit, or to confirm a check really ran.
argument-hint: "[last | all | <session id>]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-ledger.js" *)
---

# Activity ledger

The ledger is a record, not a memory: it is written by a hook as each edit and command happens, so it answers "what was done" without relying on the conversation.

## Run it

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-ledger.js" --project . --last-session
```

- `$0` is `all`: drop `--last-session`. A session id: `--session <id>`. Default: the last session.
- For a long history add `--limit 100`. For machine-readable output, `--format json`.
- `--path` prints where the ledger file lives (outside the repository, under `~/.vz-skills/ledger/`).

## Report

1. Lead with the summary line: files edited, commands, checks passed and failed.
2. Then the facts the user asked about: the files changed (group by directory when there are many), the checks with their result, failed checks first.
3. Point out anything a reviewer should know: edits outside the project, failed checks that were never followed by a passing one, and times the claim check sent you back.

## Rules

- Report only what the ledger shows. It covers edits and shell commands made through Claude Code's tools while the plugin was enabled; edits made in an editor, or before the plugin was installed, are not in it. Say so when it matters.
- Commands in the ledger are truncated and redacted; do not try to reconstruct hidden values.
- Read-only. To start fresh, the user can delete the ledger file; do not delete it yourself.

## Failure behaviour

- Empty ledger: say that nothing has been recorded yet, and check `hooks.ledger` in the effective configuration (`/vz-status`).
