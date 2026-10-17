---
name: dashboard
description: Generate a one-page HTML project dashboard from the repository's real state: settings, stack and commands, git, decision records, the current task, the AI activity ledger, and docs. Use for "where do we stand", a status overview, or before a handover.
argument-hint: "[output path]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-dashboard.js" *)
---

# Project dashboard

## Generate

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-dashboard.js" --project . --out .vz-skills/dashboard.html
```

- `$0`, if given, replaces the output path; it must be inside the project (the script refuses anything outside). `--no-git` skips the git sections (for example outside a repository).
- The page is one HTML file with no scripts and no network requests; open it in any browser. Tell the user the path. Offer to open it, using the platform's opener (`start "" <file>` on Windows, `open` on macOS, `xdg-open` on Linux) only when they say yes.

## Summarize in chat

After writing the file, give a five-line reading of it, from the page's data and nothing else:

1. The current task and next step (from the checkpoint), or "no saved task".
2. Uncommitted files and the branch.
3. Decisions still `Proposed`, if any.
4. Failed checks in the ledger that were not followed by a passing run.
5. Anything flagged: configuration errors, suspicious instruction files, UNKNOWN test command.

## Rules

- Do not add numbers or judgements the page does not show (no "project health 87%").
- `.vz-skills/dashboard.html` is generated output: recommend adding it to `.gitignore`; leave `.gitignore` alone unless asked.
- Regenerate rather than edit the HTML by hand.

## Failure behaviour

- The script fails: report its error verbatim. If it is a git problem, retry once with `--no-git` and say the git sections are missing.
