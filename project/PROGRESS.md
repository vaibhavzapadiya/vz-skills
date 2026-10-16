# VZ Skills - Progress Tracker

> This file is the source of truth across sessions. Update it after each meaningful task and before context/session end. Never mark a task verified without evidence.

## Current checkpoint

- **Current phase:** 10 - Documentation, packaging, and release readiness (final audit complete)
- **Overall status:** READY WITH LIMITATIONS (see release decision below)
- **Last updated:** 2026-10-16 (build day; all times local)
- **Current branch/commit:** `master`; see `git log --oneline` (commits: baseline kit import -> phases 0-3 -> hooks -> write-guard fix -> skills/agents -> docs/evals/packaging -> trackers/audit/release)
- **Working tree status:** clean after the final commit (`git status --porcelain` empty); `dist/` and `tests/.tmp/` are ignored
- **Next action:** owner decisions: choose a license (DEC-010); re-authenticate the CLI (`claude login`) and update to >= 2.1.269 to run `claude plugin eval` and the headless scenarios; optionally push to a git host and install from there
- **Blockers:** live model evaluation BLOCKED (CLI eval gated "early access" on 2.1.259; OAuth session expired for headless runs). Not a code blocker.

## Phase status

| Phase | Status | Evidence / notes |
|---|---|---|
| 0 Reconnaissance and control | VERIFIED | `docs/research/source-register.md` (15 dated sources), `docs/research/gap-analysis.md`, DEC-004..DEC-012, baseline commit of the kit |
| 1 Minimal package + one skill | VERIFIED | `claude plugin validate --strict` and `--json` pass; `--plugin-dir` load observed; `discover` skill + engine; `tests/structure.test.js` 8/8 |
| 2 Configuration and profiles | VERIFIED | `lib/config.js`; `tests/config.test.js` 14/14 incl. malformed, unknown, conflicting, floors, paths, examples |
| 3 Repository intelligence | VERIFIED | 13 fixtures; `tests/discovery.test.js` 17/17; preservation (TC-010/011) observed |
| 4 Core lifecycle | IMPLEMENTED / structurally TESTED; behaviour NOT VERIFIED | 9 lifecycle skills validated by both validators; eval cases written; live runs BLOCKED (auth + eval gate) |
| 5 Commands and UX | IMPLEMENTED / structurally TESTED | `setup`, `status`, `discover` as user-run skills (DEC-006); listed by `plugin details`; underlying scripts TESTED |
| 6 Hooks and safety | VERIFIED | `tests/hooks.test.js` 16/16 incl. fail-open, deny/ask, config, latency |
| 7 Specialist skills and agents | IMPLEMENTED / structurally TESTED | 7 specialists + 3 agents validated; agent frontmatter checked against plugin-agent field list |
| 8 Security and adversarial validation | VERIFIED | `docs/security.md` threat table with evidence; findings SEC-001..004; adversarial tests pass |
| 9 Evaluation and regression suite | TESTED (automated) / BLOCKED (live) | 67 automated tests pass; regression tests for 3 fixed bugs; eval suite BLOCKED by platform gate and credentials |
| 10 Docs and release readiness | VERIFIED (docs) / READY WITH LIMITATIONS (release) | `tests/docs.test.js` 7/7; `docs/release-audit.md`; `npm run package` integrity verified |

## Recent work log

| Date/time | Task | Files changed | Validation run and result | Status |
|---|---|---|---|---|
| 2026-10-16 ~17:00 | Extract kit, inspect tooling, git baseline | all kit files | `git log` shows baseline commit | VERIFIED |
| 2026-10-16 ~17:05 | Research official docs + 3 reference repos + local CLI | `docs/research/*` | 15 sources recorded with dates | VERIFIED |
| 2026-10-16 ~17:15 | Plugin skeleton, marketplace, discovery engine, discover skill | `plugins/vz-skills/**`, `.claude-plugin/marketplace.json` | `claude plugin validate --strict` pass; `plugin details` lists 1 skill | VERIFIED |
| 2026-10-16 ~17:25 | Config schema, profiles, floors | `scripts/lib/config.js`, `vz-config.js`, `docs/examples/*` | `tests/config.test.js` 14/14 | VERIFIED |
| 2026-10-16 ~17:30 | 13 fixtures + discovery tests; fixed `.github` skip, exfil regex, NODE_TEST_CONTEXT, git trim | `fixtures/**`, `tests/discovery.test.js`, `lib/discover.js`, `lib/fsutil.js` | 17/17 after fixes (4 real bugs found and fixed) | VERIFIED |
| 2026-10-16 ~17:40 | Hooks + policy + hook tests; fixed write-guard exemption | `scripts/hooks/*`, `hooks/hooks.json`, `policy/core-policy.md`, `tests/hooks.test.js` | 16/16 | VERIFIED |
| 2026-10-16 ~17:50 | 18 more skills, 3 agents, references | `skills/**`, `agents/*`, `references/*` | both validators pass; `plugin details`: 19 skills, 3 agents, ~1.8k always-on tokens | TESTED (structure) |
| 2026-10-16 ~18:00 | Docs, catalog generator, docs tests, eval cases, packaging | `docs/**`, `scripts/*`, `tests/docs.test.js`, `evals/**` | docs tests 7/7; eval run BLOCKED (see log) | TESTED / BLOCKED |
| 2026-10-16 ~18:10 | Headless scenarios | `tests/.tmp/scenario/*` (ignored) | both runs: `Failed to authenticate: OAuth session expired` | BLOCKED |
| 2026-10-16 ~18:20 | Trackers, audit, package | `project/*`, `tracking/*`, `quality/*`, `docs/release-audit.md`, `dist/*` | `npm test` 67/67; package integrity verified | VERIFIED |

## Commands/checks log

| Command | Purpose | Result | Evidence/location |
|---|---|---|---|
| `npm test` (cwd repo root) | full automated suite | exit 0; 67 pass, 0 fail, 0 skipped | `docs/testing-and-evaluation.md` |
| `claude plugin validate ./plugins/vz-skills --strict` | official structural validation | exit 0; "Validation passed" | same |
| `claude plugin validate ./plugins/vz-skills --strict --json` | JSON report | `success: true`, no errors/warnings | same |
| `claude plugin validate . --strict` | marketplace manifest | exit 0 | same |
| `claude --plugin-dir ./plugins/vz-skills plugin list` | session-only load | `vz-skills@inline ... loaded` | same |
| `claude --plugin-dir ./plugins/vz-skills plugin details vz-skills` | inventory and cost | 19 skills, 3 agents, 2 hook events, ~1,772 always-on tokens | same |
| `node scripts/gen-catalog.js --check` | docs freshness | "up to date" | `tests/docs.test.js` |
| `claude plugin eval . --case labels-unverified-work --runs 1 --ablation none ... --trust-plugin` | live eval | exit 1: unknown option `--trust-plugin` | `plugins/vz-skills/evals/results/labels-single.log` (ignored dir; quoted in docs) |
| same without `--trust-plugin` | live eval | exit 1: "`plugin eval` is currently in early access" | same |
| `claude -p "Run /vz-skills:status ..." --plugin-dir ...` (ts-app fixture copy) | live scenario | exit 1: OAuth session expired | `docs/testing-and-evaluation.md` |
| `claude -p "Read CLAUDE.md ..." --plugin-dir ...` (malicious fixture copy) | live adversarial scenario | exit 1: OAuth session expired | same |
| `npm run package` | build + verify ZIP | see `docs/release-audit.md` | `dist/vz-skills-0.1.0.manifest.json` |
| `claude plugin marketplace add .` / `claude plugin install vz-skills@vz-skills-marketplace` | real install into user settings | NOT_RUN (would modify the user's `~/.claude/settings.json`; documented from the official reference; session-only load verified instead) | `docs/install.md` |

## Open decisions

- DEC-010 license: owner must choose; blocks public distribution only.

## Next-session handoff

- First incomplete task: run the live evaluation (`plugins/vz-skills/evals`) and the two headless scenarios once credentials and CLI version allow; then upgrade Phase 4/5/7 behaviour rows from NOT VERIFIED.
- Preconditions: `claude login` succeeds in a terminal; `claude --version` >= 2.1.269.
- Files to inspect: `docs/testing-and-evaluation.md` (commands to run), `plugins/vz-skills/evals/*`.
- Exact next action: `cd plugins/vz-skills && claude plugin eval . --runs 1 --ablation none --no-publish`, then record `aggregate-result.json` figures in `docs/testing-and-evaluation.md` and flip `project/acceptance-matrix.md` REQ-008/REQ-011/REQ-015 accordingly.
- Relevant tests/checks: `npm test` must stay 67/67; `claude plugin validate --strict`.
- Known risks: platform conventions change weekly; re-check `docs/research/source-register.md` pages before any release.
- Uncommitted changes to preserve: none at handoff.
