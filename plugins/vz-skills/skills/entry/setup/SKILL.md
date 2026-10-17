---
name: setup
description: Configure VZ Skills for the current repository by creating .vz-skills/config.json with a chosen profile (FAST, BALANCED, PRODUCTION), explaining the effective settings, and never overwriting existing configuration or project instructions.
argument-hint: "[FAST|BALANCED|PRODUCTION]"
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" *), Read
---

# Set up VZ Skills in this repository

User-invoked only. Creates project configuration; does not modify CLAUDE.md, `.claude/`, or any source file.

## Steps

1. **Pick the profile.** Use `$0` if given, uppercased (`FAST`, `BALANCED`, or `PRODUCTION`); any other value: ask. Otherwise recommend one from the repository brief: FAST for prototypes/personal scripts with no CI; PRODUCTION when CI, deploy configs, auth, or payments are present; BALANCED otherwise. Ask the user to confirm before writing.
2. **Create the config** (refuses to overwrite):

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" --init <PROFILE> --project .
   ```

   If it prints `exists:`, show the current file instead and offer to explain or edit specific keys (edit only on explicit request; the write guard will ask).
3. **Explain the effective settings**:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" --explain --project .
   ```

   Summarize in five lines what the profile changes (planning threshold, test scope, review depth, security trigger, report format) and point to `node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" --profiles` for the full matrix.
4. **Suggest optional keys** relevant to this repo, without writing them: `hooks.protected_paths` for migrations/infra directories found by discovery; `conventions.notes` for anything in CONTRIBUTING.md worth repeating (or run `/vz-skills:learn-conventions` to measure them from the code); `approvals.run_project_scripts: ask` for repositories with unusual scripts.
5. **Version control note.** Recommend committing `.vz-skills/config.json` (team-wide) and adding the generated files `.vz-skills/cache/`, `.vz-skills/checkpoint.md`, and `.vz-skills/dashboard.html` to `.gitignore`. The activity ledger is stored outside the repository (`~/.vz-skills/ledger/`) and needs no entry. Do not edit `.gitignore` yourself unless asked.
6. **Do not** touch `.claude/settings.json`, `CLAUDE.md`, or user-level `~/.vz-skills/config.json`.

## Output

```
VZ Skills configured: .vz-skills/config.json (profile X) | created | already existed
Effective: planning=..., testing=..., review=..., security=..., report=...
Suggested extras: ...
Next: /vz-skills:discover, then start your task
```

## Failure behaviour

- `node` not available: report BLOCKED; VZ scripts and hooks need Node.js (Claude Code itself requires it, so this is rare).
- Config exists but is invalid: show the errors from `--explain`; propose exact fixes; edit only when the user says so.
