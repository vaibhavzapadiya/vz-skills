# VZ Skills — Acceptance Matrix

Status must be one of: `NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, `VERIFIED`, `DEFERRED`, `REJECTED`.

A row can be `VERIFIED` only with evidence linked to an observed test, official documentation check, or direct inspection appropriate to the criterion.

| ID | Requirement | Acceptance criterion | Evidence required | Status | Evidence link / notes |
|---|---|---|---|---|---|
| REQ-001 | Current platform compatibility | Shipped structures and features match current Claude Code docs | Dated official sources + validation | NOT_STARTED | |
| REQ-002 | Minimal valid package | Minimal package loads/validates through supported path | Exact command/result or platform test | NOT_STARTED | |
| REQ-003 | Skill contract | Every skill has supported metadata, scope, workflow, guardrails | Static validation + scenario test | NOT_STARTED | |
| REQ-004 | Config schema | Valid config accepted; malformed/unknown/conflicting values handled clearly | Automated tests | NOT_STARTED | |
| REQ-005 | Profiles | FAST/BALANCED/PRODUCTION differences are meaningful and documented | Behavior tests/examples | NOT_STARTED | |
| REQ-006 | Repository discovery | Stack/tools/instructions and unknowns are reported accurately | Fixture test matrix | NOT_STARTED | |
| REQ-007 | Preservation | Existing modifications and local instructions are not clobbered | Before/after fixture comparison | NOT_STARTED | |
| REQ-008 | Lifecycle | A task can flow from understanding through verified report | End-to-end scenario | NOT_STARTED | |
| REQ-009 | Commands | Every shipped command has valid syntax, useful behavior, help/errors | Platform/static/scenario checks | NOT_STARTED | |
| REQ-010 | Hooks | Shipped hooks use supported schema and have tested failure semantics | Official docs + tests | NOT_STARTED | |
| REQ-011 | Agents | Each agent has distinct purpose and valid handoff contract | Docs + scenario evidence | NOT_STARTED | |
| REQ-012 | Security | Threat model and adversarial tests cover key trust boundaries | Findings register + fixture results | NOT_STARTED | |
| REQ-013 | Honest verification | Reports distinguish implemented/tested/verified/not verified | Report tests/review | NOT_STARTED | |
| REQ-014 | Regression suite | Important behavior has repeatable regression coverage | Test command/results | NOT_STARTED | |
| REQ-015 | Evaluation | Baseline methodology and limitations are documented | Reproducible artifacts/results | NOT_STARTED | |
| REQ-016 | Installation | Install/update/rollback/uninstall instructions verified | Clean-environment walkthrough | NOT_STARTED | |
| REQ-017 | Documentation accuracy | Docs agree with shipped behavior | Final audit checklist | NOT_STARTED | |
| REQ-018 | License/attribution | Dependencies and adapted materials are compliant | License inventory/review | NOT_STARTED | |
| REQ-019 | Release readiness | No hidden critical blockers; known limitations documented | Final independent audit | NOT_STARTED | |

## Rules

- Add rows for every concrete requirement discovered during research.
- Link each implementation task to one or more requirement IDs.
- If a criterion is not testable, define a practical review procedure.
- Mark deferred work with rationale, impact, owner (if applicable), and reconsideration trigger.
