# Testing and evaluation

Two Claude Code versions appear below, and each result says which one it came from:

- **2.1.259**: the original build on 2026-10-16 (Windows 11 Pro 10.0.22000, Node v22.21.1, git 2.32.0.windows.2). The platform validation, `plugin details`, and the eval attempts were observed on this version.
- **2.1.233**: the current machine (Windows 10 Pro 10.0.19045), used for the GitHub marketplace install, the current test-suite counts, and the current `plugin details` figures.

Results are copied from the observed output. Items that could not run say why.

## Layers and what covers them

`npm test` runs `node scripts/run-tests.js`, which passes every `tests/*.test.js` file to `node --test` (Node 18 does not expand globs). It runs 107 tests.

| Layer | Where | Count | Result |
|---|---|---|---|
| Structural | `tests/structure.test.js`, `vz-validate.js`, `claude plugin validate` | 9 | PASS |
| Config | `tests/config.test.js` | 22 | PASS |
| Unit (parsers, scanners, allowlist, redaction) | inside structure/discovery suites | - | PASS |
| Fixture (discovery) | `tests/discovery.test.js` over 17 fixtures (+ inline temp repos) | 26 | PASS |
| Hooks | `tests/hooks.test.js` | 16 | PASS |
| Guard hardening (bypass attempts) | `tests/guard-hardening.test.js`: flag order, quoting, subshells, wrappers, aliases; quoted text; `refuse` messages; oversized and overlong input; linear glob matching; write-guard case variants, Claude Code paths, links pointing outside; repository text in discovery; flat-install scope detection | 8 | PASS |
| Activity ledger and claim check | `tests/activity.test.js`: ledger records (outside the project, checks marked pass or fail, redaction, `hooks.ledger: false`), claim check decisions and fail-open, `vz-ledger.js` output and flags, dashboard escaping and sections, one ledger per project after a `cd` | 5 | PASS |
| Adversarial | TC-012 (malicious CLAUDE.md), TC-013 (unsafe paths), hook deny/ask, write-guard secrets | within the above | PASS |
| CLI (installer) | `tests/cli.test.js`: package metadata, help/path/version, strict flags, doctor on a broken config, flat install at user and project scope, plugin install/update/uninstall against an isolated `CLAUDE_CONFIG_DIR` | 7 | PASS (the 3 live cycles need `claude` on PATH) |
| Integration (platform) | `tests/platform.test.js` with the real CLI | 5 | PASS on 2.1.259; on 2.1.233 4 pass and the `validate --json` test is skipped (that flag needs 2.1.259) |
| Documentation accuracy | `tests/docs.test.js` | 8 | PASS |
| Regression | TC-008 (`NODE_TEST_CONTEXT`), write-guard exemption, `.github` walk | within the above | PASS |
| Scenario (live model) | `plugins/vz-skills/evals/` and headless runs | 3 cases | BLOCKED (see below) |
| Release | `tests/package.test.js` + `npm run package` integrity check (bsdtar, backslash-free entries, sizes, SHA-256) | 1 | PASS |

Total: 9 + 22 + 26 + 16 + 8 + 5 + 7 + 5 + 8 + 1 = 107.

## Observed results

On Claude Code 2.1.233:

```
> npm test            (node scripts/run-tests.js: node --test over tests/*.test.js)
# tests 107
# pass 106
# fail 0
# skipped 1           (platform: validate --strict --json needs Claude Code >= 2.1.259)
```

On 2.1.259 or later the skipped test runs as well (the 84-test suite of the original build passed with none skipped on 2.1.259).

On Claude Code 2.1.259 (original build):

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
Skills (24) ...  Agents (3) ...  Hooks (2) PreToolUse, SessionStart
```

On Claude Code 2.1.233, the platform test checks `plugin details` against the plugin: 33 skills, 3 agents, and 5 hook events (`PreToolUse`, `SessionStart`, `PostToolUse`, `PostToolUseFailure`, `Stop`). The always-on context cost it reports is about 2,826 tokens for 33 skills (it was ~1,772 tokens at 19 skills on 2.1.259). `tests/platform.test.js` checks that it stays under 4,000. Run `claude --plugin-dir ./plugins/vz-skills plugin details vz-skills` for the current figure.

On Claude Code 2.1.233, `claude plugin list` prints the status as `✔ enabled` instead of `✔ loaded`.

## Fixture matrix - status

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
| Ruby (`ruby-app`) | (unnumbered) | bundler + `Gemfile.lock`; `bundle exec rspec` CONFIRMED from the Gemfile; rails/minitest variant INFERRED | PASS |
| PHP (`php-app`) | (unnumbered) | composer; `composer test` CONFIRMED from `scripts.test`; `phpunit.xml` alone gives `vendor/bin/phpunit` | PASS |
| Maven (`maven-app`) | (unnumbered) | `./mvnw test` INFERRED (maven convention); falls back to `mvn` without the wrapper | PASS |
| Gradle + Kotlin (`gradle-kotlin-app`) | (unnumbered) | `./gradlew test` INFERRED; language kotlin INFERRED from the build file; falls back to `gradle` | PASS |
| Node lint/format inference | (unnumbered) | ESLint/Prettier config files or package.json keys without a script -> INFERRED `<pm> exec eslint .` / `prettier --check .` with the config file as evidence; declared scripts win; no config or dependency-only stays UNKNOWN | PASS |

## Hook tests - status

16 tests in `tests/hooks.test.js`, 8 in `tests/guard-hardening.test.js` (bypass attempts), and 5 in `tests/activity.test.js` (activity ledger and claim check); see the table above. `tests/hooks.test.js` covers: declaration shape, silent pass-through (10 ordinary commands), 12 catastrophic denies, 17 risky asks by category, PowerShell parity, `refuse` approvals and protected paths, acknowledged vs unacknowledged `off`, fail-open on 5 malformed inputs for the command guard, write guard, and session hook, broken config, write-guard silent/deny/ask/content/placeholder/fixture cases, session-context output shape and 9,000-char cap, config disable, idempotency, and a 2.5 s latency budget. All PASS.

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
