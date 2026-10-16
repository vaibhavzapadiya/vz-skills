---
name: plan
description: Produce a focused, risk-tiered implementation plan: ordered small slices with file paths, tests per slice, verification commands, and rollback. Use after acceptance criteria exist and the profile's planning.plan_when requires a plan for the change's risk tier, or whenever the user asks for a plan or spec.
argument-hint: "[task or acceptance criteria]"
---

# Plan the implementation

A plan is a sequence of thin vertical slices, each independently verifiable. It is not an essay.

## Inputs

- Acceptance criteria and risk tier from `clarify` (or derive them quickly if absent and the task is clear).
- Repository brief: CONFIRMED commands for build/test/lint/typecheck, layout, conventions, dirty files.
- Profile: `planning.depth` (minimal | standard | detailed), `testing.tdd`, `testing.strategy`, `review.*`, `security.review_trigger`, `documentation.expectation`.

## Workflow

1. **Locate the change surface.** Grep/Read the modules, tests, and call sites involved. Record the exact files (existing and new). If a needed fact is unknown (framework behaviour, runtime version), say so and plan a spike slice to find out instead of guessing.
2. **Choose the approach.** Prefer the pattern the repository already uses. Note one rejected alternative and why (one line) when `planning.depth` is `standard` or `detailed`.
3. **Slice the work.** Each slice: 1-3 files, one behaviour, its own test, its own verification command, and a clear stop point. Order so that each slice leaves the tree green. Put the riskiest or most uncertain slice first.
4. **Attach verification** to every slice using only CONFIRMED/INFERRED commands from discovery. If the project has no tests, each slice gets a manual check written as a concrete command or observation, flagged NOT VERIFIED until performed.
5. **Call out risks and guardrails**: data migrations, backwards compatibility, performance budgets, security-sensitive paths (then `security-review` is mandatory in `verify`), and untouched dirty files to preserve.
6. **Size by depth**:
   - `minimal`: slices + commands only (5-15 lines).
   - `standard`: plus approach, rejected alternative, risks, rollback.
   - `detailed`: plus interface sketches (signatures, schema diffs), test matrix per criterion, documentation updates, and a rollback procedure.
7. **For `api-design`, `database`, `frontend`, `backend` concerns**, invoke the matching specialist skill for its checklist and fold the results into the slices.

## Output

```
Plan: <title>   Risk: <tier>   Profile: <name>   Depth: <depth>
Approach: <one paragraph>  (rejected: <alt> because <why>)
Slices:
  S1 <behaviour> - files: a.ts, a.test.ts - verify: `pnpm test -- a` - stop when: <observable>
  S2 ...
Criteria coverage: AC1 -> S1; AC2 -> S2,S3; AC4 -> manual (NOT VERIFIED)
Risks/guardrails: ...
Docs to update: ... (per documentation.expectation)
Rollback: ...
Next: implement S1
```

If `clarification.ask_before_implementing` is `always`, or the risk tier is high, present the plan and wait for the user's go-ahead before `implement`.

## Safety and preservation

- Planning is read-only. Do not scaffold files "to save time".
- Never plan a step that runs an unreviewed project script, deletes data, or publishes anything without an explicit approval slice ("ask user") in the sequence.

## Failure behaviour

- Unknown test command: plan a first slice "establish test command" (run `discover`, read CONTRIBUTING, try the INFERRED command once) rather than assuming.
- Conflicting instructions (CLAUDE.md vs lockfile): choose the manifest/lockfile, note the conflict, ask only if it affects the task.

## Validation scenarios

- Feature on the ts-app fixture -> slices reference `pnpm test` (CONFIRMED) and real file paths.
- Unknown-stack fixture -> plan's first slice is a spike to establish how to build/run; no invented commands.
