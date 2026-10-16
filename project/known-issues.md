# VZ Skills - Known Issues and Blockers

Keep this file factual. Do not leave resolved issues open, and do not erase unresolved risks to make the release look cleaner. Last updated 2026-10-16.

## Open issues

| ID | Severity | Description | Impact | Workaround | Next action | Status |
|---|---|---|---|---|---|---|
| KI-002 | medium | Live model evaluation cannot run: `claude plugin eval` prints "currently in early access" on CLI 2.1.259 (docs require >= 2.1.269), and headless `claude -p` runs fail with "OAuth session expired and could not be refreshed" | Skill/agent *behaviour* is NOT VERIFIED; only structure, config, discovery, and hooks are TESTED/VERIFIED | Use the plugin interactively and judge; automated suite still covers the deterministic layers | Owner: `claude login`, `claude update`; then run the commands in `docs/testing-and-evaluation.md` | OPEN (BLOCKED) |
| KI-003 | low | No `LICENSE` file and no `license` field in `plugin.json` | Cannot be redistributed publicly; private/internal use unaffected | None | Owner chooses a license (DEC-010); add file and manifest field | OPEN (decision) |
| KI-004 | low | Marketplace install path (`claude plugin marketplace add` + `install`) was documented from the official reference but not executed, because it writes the user's `~/.claude/settings.json` | Install docs for that path are NOT VERIFIED by observation | Session-only `--plugin-dir` path is verified and sufficient for trial | Owner runs the two commands once and records the output in `project/PROGRESS.md` | OPEN |
| KI-005 | low | Command and write guards are regex heuristics; discovery injection scanner is heuristic | False negatives possible for unusual phrasing; false positives (asks) possible for benign commands containing `sudo`/`rm -r` | Native permissions remain the boundary; adjust `approvals.*`/`protected_paths` | Collect real-world misses and add patterns with tests | OPEN (by design, documented) |

## Resolved during the build

| ID | Severity | Description | Resolution |
|---|---|---|---|
| KI-001 | - | Initial state: research and implementation not yet run | Phases 0-10 executed; see `project/PROGRESS.md` |
| SEC-001 | medium | Baseline runner inherited `NODE_TEST_CONTEXT` from a parent `node --test`, masking a failing suite as exit 0 | env scrubbed in `runBaseline`; regression test TC-008 |
| SEC-002 | low | Write guard exempted any path containing `test`, including whole projects under `tests/` | exemption now uses the project-relative path; test added |
| SEC-003 | low | Walker skipped `.github`, hiding CI evidence | fixed; TC-004 asserts CI corroboration |

## Deferred work

| ID | Item | Reason deferred | Impact | Reconsider when | Status |
|---|---|---|---|---|---|
| DF-001 | Performance, docs, and test-strategist agents | No evidence that isolation beats in-context skills for these roles; orchestration cost | None for v1 | Eval data shows review-style delegation helps and users ask for them | DEFERRED |
| DF-002 | Stop/UserPromptSubmit/PostToolUse hooks | Loop risk and per-prompt latency without a demonstrated benefit | None | A concrete, deterministic check is identified that must run every turn | DEFERRED |
| DF-003 | Legacy `commands/` directory | Official docs recommend skills; duplicates would double the listing cost | None (skills serve as commands) | Platform drops user-invocable skills (unlikely) | REJECTED |
| DF-004 | Other runtimes (Codex, Cursor, Gemini CLI) | Out of v1 scope (DEC-001) | None | v2 planning | DEFERRED |
| DF-005 | Plain-Claude-Code baseline comparison | Requires the blocked eval runner's two-arm mode | No performance claims are made | KI-002 resolved | DEFERRED |
| DF-006 | Discovery cache automatic invalidation on arbitrary file changes | Key covers manifests, instruction files, and HEAD only | Stale brief possible after unusual changes; `/vz-skills:discover` without `--cached` always refreshes | Users report stale caches | DEFERRED |

## Blocker template

- **ID / severity:**
- **Observed behavior/evidence:**
- **Expected behavior:**
- **Impact:**
- **Options:**
- **Smallest user decision required:**
- **Workaround:**
