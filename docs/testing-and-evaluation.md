# Testing and evaluation

Everything below was executed on 2026-10-16 on the build machine (Windows 11 Pro 10.0.22000, Node v22.21.1, git 2.32.0.windows.2, Claude Code 2.1.259). Results are copied from the observed output. Items that could not run say why.

## Layers and what covers them

| Layer (quality/test-strategy.md) | Where | Count | Result |
|---|---|---|---|
| Structural | `tests/structure.test.js`, `vz-validate.js`, `claude plugin validate` | 8 | PASS |
| Config | `tests/config.test.js` | 14 | PASS |
| Unit (parsers, scanners, allowlist, redaction) | inside structure/discovery suites | - | PASS |
| Fixture (discovery) | `tests/discovery.test.js` over 13 fixtures | 17 | PASS |
| Adversarial | TC-012 (malicious CLAUDE.md), TC-013 (unsafe paths), hook deny/ask, write-guard secrets | within the above | PASS |
| Integration (platform) | `tests/platform.test.js` with the real CLI | 5 | PASS |
| Documentation accuracy | `tests/docs.test.js` | 7 | PASS |
| Regression | TC-008 (`NODE_TEST_CONTEXT`), write-guard exemption, `.github` walk | within the above | PASS |
| Scenario (live model) | `plugins/vz-skills/evals/` and headless runs | 3 cases | BLOCKED (see below) |
| Release | `npm run package` integrity check | 1 | see release section |

## Observed results

```
> npm test            (node --test tests/*.test.js)
# tests 67
# pass 67
# fail 0
# skipped 0
```

```
> claude plugin validate ./plugins/vz-skills --strict
✔ Validation passed
> claude plugin validate ./plugins/vz-skills --strict --json
{"success": true, "strict": true, ... "errors": [], "warnings": []}
> claude plugin validate . --strict            (marketplace)
✔ Validation passed
> claude --plugin-dir ./plugins/vz-skills plugin list
vz-skills@inline  Version: 0.1.0  Status: ✔ loaded
> claude --plugin-dir ./plugins/vz-skills plugin details vz-skills
Skills (19) ...  Agents (3) ...  Hooks (2) PreToolUse, SessionStart
Always-on: ~1,772 tok added to every session
```

## Fixture matrix (spec/repository-intelligence.md) - status

| Fixture | Test | Key assertion | Status |
|---|---|---|---|
| TypeScript single package | TC-004 | `pnpm test` CONFIRMED from scripts and corroborated by CI | PASS |
| Python project | TC-005 | `uv run pytest` CONFIRMED; ruff/mypy; requires-python | PASS |
| Monorepo | TC-006 | turbo + 3 workspace packages enumerated | PASS |
| No tests | TC-007 | test command `(none)` CONFIRMED; npm placeholder recognised | PASS |
| Failing baseline | TC-008 | `--run-baseline` -> FAIL with exit code, tail, pre-existing note | PASS |
| Unknown stack | TC-009 | language UNKNOWN; all commands UNKNOWN; nothing invented | PASS |
| Custom CLAUDE.md + .claude/rules | TC-010 | listed as untrusted; file byte-identical afterwards | PASS |
| Dirty working tree | TC-011 | `M src/index.ts` and untracked listed; edit preserved | PASS |
| Conflicting instructions | (unnumbered) | CONFLICTING package manager with all three sources | PASS |
| Malicious instructions | TC-012 | 5 indicator classes flagged; `.env` never read; content not echoed | PASS |
| Malformed manifest | (unnumbered) | parse error surfaced; facts degrade to UNKNOWN/INFERRED | PASS |
| Missing tool | TC-015 | runner unavailable -> baseline BLOCKED with reason | PASS |
| .NET and Go | (unnumbered) | INFERRED conventions; Makefile target CONFIRMED with alternative | PASS |
| Generated/vendor folders | part of TC-011 | `.gitignore` entries parsed | PASS |

## Hook tests - status

16 tests in `tests/hooks.test.js`: declaration shape, silent pass-through (10 ordinary commands), 12 catastrophic denies, 17 risky asks by category, PowerShell parity, `refuse` approvals and protected paths, acknowledged vs unacknowledged `off`, fail-open on 5 malformed inputs for all 3 hooks, broken config, write-guard silent/deny/ask/content/placeholder/fixture cases, session-context output shape and 9,000-char cap, config disable, idempotency, and a 2.5 s latency budget. All PASS.

## Live model evaluation - BLOCKED

Three eval cases exist in the official format (`plugins/vz-skills/evals/`): `routes-vague-request-to-clarify`, `refuses-malicious-repo-instructions` (uses `context.add_dirs` with an injected CLAUDE.md), `labels-unverified-work`. Each has a deterministic grader (`tool_used` / `regex`) and an `llm` rubric.

Attempts to run them:

1. `claude plugin eval . --case labels-unverified-work --runs 1 --ablation none --no-publish --trust-plugin --max-cost-usd 3 --json ...` -> `error: unknown option '--trust-plugin'` (exit 1). The flag is documented for >= 2.1.269; the installed CLI is 2.1.259.
2. Same without `--trust-plugin` -> `` `plugin eval` is currently in early access `` (exit 1). The command is gated on this version.

Headless scenario runs (`claude -p ... --plugin-dir ./plugins/vz-skills --output-format json`) on copies of the ts-app and malicious-instructions fixtures both returned `Failed to authenticate: OAuth session expired and could not be refreshed` (exit 1, 0 model turns, cost 0). This is a credential state on the build machine's CLI, not a plugin problem.

**What would unblock:** `claude update` to >= 2.1.269 for `plugin eval`, and `claude login` (or `ANTHROPIC_API_KEY`) for any live run. Each eval run costs model calls on the account; `--runs 1 --ablation none` keeps a first pass cheap. Until then, behavioural claims about the skills are **NOT VERIFIED**; the structural, configuration, discovery, and hook behaviour claims are TESTED.

## Baseline comparison with plain Claude Code

Not performed. A fair comparison needs the eval runner's two-arm mode (with and without the plugin) on the same prompts with repetitions, which is exactly what is blocked above. No superiority claim is made anywhere in this project. The methodology, when it becomes possible: run the three shipped cases with `--ablation with-without --runs 3`, pin `--model` and `--judge-model`, record `aggregates.meanDelta` and per-case deltas from `aggregate-result.json`, disclose the sample size (3 cases x 3 runs), and treat `tool_used: Skill` graders as fired-indicators only (the runner already excludes them from Δ).

## Manual checks performed during the build (TESTED, not automated)

- Discovery on this repository and on an unrelated local .NET microservices repository (read-only): sensible stack/command output, no crashes, `.env` files not read.
- `vz-config.js --init/--explain/--profiles/--schema` on temporary projects.
- Session hook on this repository produced the policy, profile summary, and brief within the cap.

## How to re-run everything

```bash
npm test
claude plugin validate ./plugins/vz-skills --strict
node scripts/gen-catalog.js --check
npm run package
# when unblocked:
cd plugins/vz-skills && claude plugin eval . --runs 1 --ablation none --no-publish
```
