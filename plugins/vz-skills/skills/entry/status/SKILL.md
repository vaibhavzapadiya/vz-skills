---
name: status
description: Show the VZ Skills state for this repository: effective profile and settings with their sources, configuration errors or safety-override warnings, hook status, and a brief repository discovery with git state. Read-only diagnostic.
disable-model-invocation: true
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" *), Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-discover.js" *), Read
---

# VZ Skills status

User-invoked, read-only. Use it to answer "what will VZ do here and why".

## Steps

1. **Configuration**:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" --explain --project .
   ```

   Report: profile and its source (default / user / project / env), every key whose value comes from an explicit layer, all ERROR lines (config invalid; floors enforced), and all WARNING lines (acknowledged safety downgrades).
2. **Hooks**: state which VZ hooks are active per config (`hooks.command_guard`, `hooks.write_guard`, `hooks.session_context`, `hooks.ledger`, `hooks.claim_check`) and remind that they are advisory; `disableAllHooks` in Claude Code settings turns them off entirely (do not change that setting).
3. **Repository brief**:

   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-discover.js" . --format md --brief
   ```

   Summarize stack, commands with labels, test presence, git branch and dirty files, instruction files and any suspicious indicators, conflicts, unknowns.
4. **Cache**: if `.vz-skills/cache/discovery.json` exists, show its `written_at`; it is stale if manifests or HEAD changed since then, and only `/vz-skills:discover` with `--cache` rewrites it.
5. **Suggest** the next action: `/vz-skills:setup` when no project config exists; `/vz-skills:discover` for the full report; fix config errors when present.

## Output

```
Profile: X (source) | config: valid | INVALID (n errors) | n safety overrides acknowledged
Effective: planning=..., testing=..., review=..., security=..., report=...
Hooks: command_guard=on, write_guard=on, session_context=on (advisory)
Repo: <stack>, test=<cmd (label)>, branch <b>, dirty <n> files, instructions <n> (<suspicious?>)
Unknowns/conflicts: ...
Next: ...
```

## Rules

- Do not modify any file.
- Do not print the contents of `.env` or other sensitive files even if listed.
