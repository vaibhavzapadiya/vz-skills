---
name: verify
description: Final verification and evidence-based completion report: re-check every acceptance criterion, re-run the required checks, confirm untouched files are untouched, and label each claim IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED in the profile's report format. Use before telling the user a task is done, or when asked "is this finished".
argument-hint: "[task or criteria to verify]"
---

# Verify and report

The report is the deliverable. It must survive a sceptical reader who did not watch the work.

## Inputs

- Acceptance criteria, plan, and the slice reports from `implement`.
- Test results from `test`, review verdict from `review`, findings from `security-review` (if run).
- Profile: `verification.depth` (targeted | standard | exhaustive), `response.final_report` (summary | evidence-table | full), `verification.require_evidence_labels` (always true unless an acknowledged override).
- Template: `${CLAUDE_PLUGIN_ROOT}/references/report-template.md`.

## Workflow

1. **Freeze the change set.** `git status --porcelain` and `git diff --stat`. Separate: files changed by this task; files that were already dirty at discovery (you cannot prove them byte-identical unless you recorded their diff then: state that you made no edits to them, and mark their integrity NOT VERIFIED if nothing was recorded); generated files.
2. **Re-run, do not recall.** By depth:
   - `targeted`: the checks named by the slices that changed since they last ran.
   - `standard`: the test strategy from the profile (`testing.strategy`) plus lint/typecheck if CONFIRMED.
   - `exhaustive`: full suite, lint, typecheck, build, and the CI steps discovery found that only test, lint, typecheck, or build. Never run CI steps that publish, deploy, push, release, or need credentials (core policy 7). Add a fresh independent review if the diff changed after the last one.
   Record each command verbatim with exit code and counts. A check that ran earlier but not after the last edit is NOT VERIFIED until re-run.
3. **Walk each acceptance criterion.** For each: evidence (test name + result, or command + output, or a manual observation you actually made). Assign the label. "Should work" is NOT VERIFIED.
4. **Check the guardrails.** Must-not-change behaviours from `clarify`: name the test or check that proves each still holds. Untouched dirty files: confirm untouched. No secrets introduced: `git diff --name-only -G "(api[_-]?key|secret|token|password)"`, then judge each hit; report real ones by file and line, never by value.
   **Security review owed?** If the risk tier is high, or `security.review_trigger` applies to this change, and no `security-review` ran after the last edit, run `/vz-skills:security-review` now; if it cannot run, the verdict is `not done`.
5. **Collect open items.** BLOCKED checks with exact reasons and unblock steps; NOT VERIFIED criteria with what would verify them; review findings still open; deferred follow-ups.
6. **Write the report** in the configured format. Keep it factual: no "successfully", no "robust", no adjectives in place of evidence.
7. **Decide the verdict:** `done` (all criteria VERIFIED or explicitly accepted as NOT VERIFIED by the user), `done with limitations` (some criteria NOT VERIFIED, each listed with what would verify it), or `not done` (a criterion failed, a required check is BLOCKED, or a blocker is open). Say which.

## Rules

- Never upgrade a label without new evidence. TESTED means you saw the output in this session after the final edit.
- Never hide a red check behind "unrelated". It is either baseline (named in the baseline section) or a regression.
- Never include secret values, full env dumps, or long logs; quote the lines that carry the evidence.
- If the user asked for commits or a PR, state exactly what was committed/pushed and what was not. Never push or publish inside this skill.

## Failure behaviour

- Checks cannot run (missing tool, no network, no credentials): BLOCKED rows with the executable/permission needed; verdict cannot be `done`.
- Criteria were never written down: reconstruct them from the request, mark them "inferred", and recommend `clarify` next time.

## Output

The report per `report-template.md`, ending with:

```
Verdict: done | done with limitations | not done
User decisions needed: <none or list>
```

## Validation scenarios

- All tests green but one criterion has no test -> that criterion is NOT VERIFIED and the verdict is "done with limitations".
- A dirty file from before the task differs now -> blocker in the report until explained or restored.
- Test runner missing -> every TESTED claim becomes BLOCKED, verdict "not done".
