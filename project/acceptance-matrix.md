# VZ Skills - Acceptance Matrix

Status must be one of: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, `VERIFIED`, `DEFERRED`, `REJECTED`.

A row can be `VERIFIED` only with evidence linked to an observed test, official documentation check, or direct inspection appropriate to the criterion. Last updated 2026-10-16 after the final audit.

| ID | Requirement | Acceptance criterion | Evidence required | Status | Evidence link / notes |
|---|---|---|---|---|---|
| REQ-001 | Current platform compatibility | Shipped structures and features match current Claude Code docs | Dated official sources + validation | VERIFIED | `docs/research/source-register.md` (S-02..S-11, accessed 2026-10-16); `claude plugin validate --strict --json` success on 2.1.259; `tests/platform.test.js` 5/5 |
| REQ-002 | Minimal valid package | Minimal package loads/validates through supported path | Exact command/result or platform test | VERIFIED | `claude --plugin-dir ./plugins/vz-skills plugin list` -> `vz-skills@inline ... loaded`; `plugin details` inventory |
| REQ-003 | Skill contract | Every skill has supported metadata, scope, workflow, guardrails | Static validation + scenario test | TESTED | `vz-validate.js` (supported-field allowlist, description, body, links) + official validator pass for 19 skills; scenario behaviour NOT VERIFIED (live runs BLOCKED) |
| REQ-004 | Config schema | Valid config accepted; malformed/unknown/conflicting values handled clearly | Automated tests | VERIFIED | `tests/config.test.js` 14/14: TC-002, TC-003, typos with suggestions, wrong types, floors, PRODUCTION conflicts, unsafe paths, version |
| REQ-005 | Profiles | FAST/BALANCED/PRODUCTION differences are meaningful and documented | Behavior tests/examples | VERIFIED | profile matrix asserted in `tests/config.test.js` and cross-checked against `docs/configuration.md` by `tests/docs.test.js`; skills branch on the fields by name |
| REQ-006 | Repository discovery | Stack/tools/instructions and unknowns are reported accurately | Fixture test matrix | VERIFIED | `tests/discovery.test.js` 17/17 over 13 fixtures (TC-004..TC-009, TC-012, TC-015 + extras) |
| REQ-007 | Preservation | Existing modifications and local instructions are not clobbered | Before/after fixture comparison | VERIFIED | TC-010 (CLAUDE.md byte-identical), TC-011 (user edit preserved, dirty files listed); write guard asks before touching instructions (`tests/hooks.test.js`) |
| REQ-008 | Lifecycle | A task can flow from understanding through verified report | End-to-end scenario | IMPLEMENTED | 9 lifecycle skills + references + policy exist and validate; end-to-end live scenario BLOCKED (OAuth expired; eval gated). Deterministic parts (discover, config, baseline) TESTED |
| REQ-009 | Commands | Every shipped command has valid syntax, useful behavior, help/errors | Platform/static/scenario checks | TESTED | user-run skills `setup`/`status`/`discover` validated and listed by the CLI; their scripts have CLI tests (`--help`, exit codes 0/1/2/3, refusals). Live invocation NOT VERIFIED |
| REQ-010 | Hooks | Shipped hooks use supported schema and have tested failure semantics | Official docs + tests | VERIFIED | schema per S-05/S-07; `tests/hooks.test.js` 16/16 incl. fail-open, deny/ask, timeouts declared, latency |
| REQ-011 | Agents | Each agent has distinct purpose and valid handoff contract | Docs + scenario evidence | IMPLEMENTED | 3 agents with distinct scope and output contracts; frontmatter validated against plugin-agent field list; delegation behaviour NOT VERIFIED live |
| REQ-012 | Security | Threat model and adversarial tests cover key trust boundaries | Findings register + fixture results | VERIFIED | `docs/security.md` (11 threats mapped to mitigations and tests; findings SEC-001..004); TC-012, TC-013, hook adversarial cases pass |
| REQ-013 | Honest verification | Reports distinguish implemented/tested/verified/not verified | Report tests/review | TESTED | vocabulary enforced in policy, `verify` skill, report template; `verification.require_evidence_labels` floored true (config test); eval case `labels-unverified-work` written but BLOCKED |
| REQ-014 | Regression suite | Important behavior has repeatable regression coverage | Test command/results | VERIFIED | `npm test` 67/67; regression tests for SEC-001..003 |
| REQ-015 | Evaluation | Baseline methodology and limitations are documented | Reproducible artifacts/results | IMPLEMENTED | eval cases + methodology in `docs/testing-and-evaluation.md`; no results (BLOCKED); no superiority claims made |
| REQ-016 | Installation | Install/update/rollback/uninstall instructions verified | Clean-environment walkthrough | TESTED | session-only install verified by observation; marketplace add/install/uninstall documented from the official reference and NOT run (would write the user's settings) |
| REQ-017 | Documentation accuracy | Docs agree with shipped behavior | Final audit checklist | VERIFIED | `tests/docs.test.js` 7/7 (schema keys, profile matrix, generated catalog, counts, links, versions, references); `docs/release-audit.md` |
| REQ-018 | License/attribution | Dependencies and adapted materials are compliant | License inventory/review | TESTED | zero runtime deps; nothing copied from MIT reference repos (register); project license undecided (DEC-010) -> cannot be VERIFIED until chosen |
| REQ-019 | Release readiness | No hidden critical blockers; known limitations documented | Final independent audit | VERIFIED | `docs/release-audit.md`: READY WITH LIMITATIONS; limitations listed in `project/known-issues.md` |

## Rules

- Add rows for every concrete requirement discovered during research.
- Link each implementation task to one or more requirement IDs.
- If a criterion is not testable, define a practical review procedure.
- Mark deferred work with rationale, impact, owner (if applicable), and reconsideration trigger.
