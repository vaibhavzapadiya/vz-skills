# VZ Skills — Phased Execution and Delivery Protocol

The master prompt defines **what** VZ Skills must become. This protocol defines **how** to build it without attempting the entire project in one pass.

## Operating rule

Work in small, validated vertical slices. Finish each phase's exit criteria before starting dependent work. Do not stop to request approval after every phase. Continue automatically unless blocked by a real product decision, a destructive action, credentials, external side effects, or a missing capability that materially changes scope.

## Phase 0 — Reconnaissance, research, and project control

1. Inspect repository files, git status, existing modifications, current project instructions, package/tooling, and Claude Code setup.
2. Do not overwrite or discard user changes.
3. Verify current official Claude Code docs and reference projects; record dated sources and uncertainty.
4. Create or adapt the project control files:
   - `docs/project/implementation-roadmap.md`
   - `docs/project/progress.md`
   - `docs/project/decisions.md`
   - `docs/project/acceptance-matrix.md`
   - `docs/project/known-issues.md`
   - `docs/research/gap-analysis.md`
5. Break the master requirements into atomic, traceable deliverables.
6. Identify platform constraints, risks, dependencies, and a minimal viable vertical slice.

**Exit criteria:** repository state is understood; research is recorded; tracker and acceptance matrix exist; first implementation slice is chosen; no unrecorded destructive action has occurred.

## Phase 1 — Minimal valid plugin skeleton + one real skill

1. Confirm current plugin/package conventions from official docs.
2. Build the smallest valid package structure.
3. Implement one end-to-end, genuinely useful skill.
4. Add a minimal validation check for package/skill structure.
5. Validate against docs and run the check.
6. Document how to load/test it locally.

**Exit criteria:** minimal package is structurally valid by the checks available; one skill has real instructions and a clear test scenario; validation results are recorded.

## Phase 2 — Configuration and profiles

1. Design configuration schema and precedence.
2. Implement FAST, BALANCED (default), and PRODUCTION profiles only if the schema makes them meaningful.
3. Add examples, validation, actionable errors, and tests.
4. Ensure preferences cannot silently override platform permissions or weaken core safety behavior.
5. Test malformed, missing, unknown, and conflicting values.

**Exit criteria:** schema and precedence are documented; sample configs validate; invalid configurations fail clearly; tests run and are recorded.

## Phase 3 — Repository intelligence

1. Implement stack and tool discovery.
2. Separate confirmed facts, inferred values, and unknowns.
3. Detect project instructions and existing changes.
4. Avoid running arbitrary scripts without risk assessment.
5. Add fixtures for at least TypeScript, Python, monorepo, unknown stack, no tests, failing tests, and custom instructions.
6. Validate discovery output and safety behavior.

**Exit criteria:** discovery handles supported fixtures; unknowns are explicit; existing work/instructions are preserved; limitations are documented.

## Phase 4 — Core lifecycle

Implement and validate a coherent path through:
1. understand repository and task;
2. clarify requirements and define acceptance criteria;
3. create a focused plan/spec;
4. implement in small changes;
5. test or follow a suitable test-first workflow;
6. debug via evidence and root-cause analysis;
7. review changes and security risks;
8. verify acceptance criteria;
9. produce an evidence-based completion report.

Build a narrow complete path first, then expand. Avoid implementing a dozen disconnected shallow skills.

**Exit criteria:** representative lifecycle scenarios complete with observable, accurate outcomes; failures and blocked checks are reported honestly.

## Phase 5 — Commands and user experience

1. Recheck supported command/plugin conventions.
2. Add only useful, non-overlapping entry points.
3. Route commands to reusable skills rather than duplicate logic.
4. Validate names, arguments, help, error cases, and configuration behavior.
5. Document examples and expected outcomes.

**Exit criteria:** every shipped command is valid, useful, tested as far as the environment permits, and documented.

## Phase 6 — Hooks and safety

1. Re-evaluate whether each proposed hook is necessary.
2. Verify exact supported events, schemas, timeout/failure semantics.
3. Implement only proportionate, deterministic hooks.
4. Test normal, malformed, error, timeout, and idempotent behavior where applicable.
5. Document limitations; never claim hooks are a complete security boundary.
6. Preserve native permission and sandbox expectations.

**Exit criteria:** each hook has evidence of schema validity and behavior; risks and failure semantics are documented; unnecessary hooks are omitted.

## Phase 7 — Specialist skills and agents

1. Review remaining lifecycle and specialist gaps.
2. Add focused skills for review/security, performance, frontend/backend, database/API, docs, release, or other areas only when they provide distinct value.
3. Add specialist subagents only after verifying platform support and a clear benefit.
4. Test skill routing, scope, handoff contracts, and outputs.
5. Remove duplication and low-value abstractions.

**Exit criteria:** shipped specialists have clear boundaries and scenarios; duplication and orchestration overhead are justified.

## Phase 8 — Security and adversarial validation

1. Review trust boundaries, file writes, shell execution, secrets, dependencies, hooks, and configuration.
2. Add malicious repository instruction fixtures and malformed input tests.
3. Verify the system treats repository content as untrusted data.
4. Confirm destructive/external actions are appropriately gated.
5. Record findings by severity, remediation, and residual risk.

**Exit criteria:** no unresolved critical/high-severity issue is silently accepted; limitations and residual risks are explicit.

## Phase 9 — Automated evaluation and regression suite

1. Implement structural, configuration, and scenario tests.
2. Create reproducible task fixtures and scoring criteria.
3. Add a regression test for each important bug.
4. Compare with a plain Claude Code baseline only when feasible and fair.
5. Record environment, prompts, repetitions, raw results, and limitations.
6. Avoid unsupported superiority claims.

**Exit criteria:** the test suite is runnable and documented; results are reproducible to the degree practical; unrun tests are clearly identified.

## Phase 10 — Documentation, packaging, and release readiness

1. Audit docs against actual behavior.
2. Verify install, update, rollback, and uninstall steps.
3. Check package contents, versioning, license/attribution, dependency inventory, and release notes.
4. Run the complete feasible validation suite.
5. Resolve known issues or explicitly defer them with rationale.
6. Complete the acceptance matrix and final audit.

**Exit criteria:** docs and code agree; all feasible checks have results; blockers and deferred work are explicit; project status is honestly stated.

## Required workflow for every task and phase

For each atomic task:
1. State the deliverable and acceptance criteria in the tracker.
2. Inspect relevant files and dependencies before editing.
3. Implement the smallest useful slice.
4. Run the narrowest relevant validation immediately.
5. Fix failures before expanding scope.
6. Review the diff for regressions, unsafe behavior, accidental scope creep, and user-data loss.
7. Update progress, decisions, risks, and known issues.
8. Confirm exit criteria with evidence.
9. Continue to the next dependency-ready task.

## Checkpoint and context management

Before context limits or session end:
- update `docs/project/progress.md`;
- mark each task status and evidence;
- record the exact next action and blockers;
- record changed paths and commands run;
- preserve uncommitted changes;
- avoid a vague “continue where you left off” note.

At the beginning of a resumed session:
- read progress, roadmap, known issues, decisions, and acceptance matrix;
- inspect actual git/filesystem state;
- verify the checkpoint against reality;
- continue from the first incomplete dependency-ready task.

## Progress reporting

At milestones, provide a concise report:
- completed;
- validation run and observed result;
- remaining;
- blockers/decisions needed;
- next phase.

Do not narrate every tiny action. The detailed repository tracker is the source of truth.

## Stop conditions

Stop only when:
- a consequential user decision is genuinely required;
- an action would be destructive or have external side effects and lacks authorization;
- required credentials/permissions are unavailable;
- a platform constraint blocks the intended approach;
- further work would require inventing facts or misrepresenting verification.

When blocked, document exact evidence, impact, options, and the smallest user decision needed. Do not silently skip the work.
