# Completion report template

Status labels (use exactly these words): **IMPLEMENTED** (files exist), **TESTED** (a check ran and its result was observed), **VERIFIED** (acceptance criteria satisfied with evidence), **BLOCKED** (cannot proceed; reason and unblock path given), **NOT VERIFIED** (no evidence, or a required check could not run).

## `summary` format (FAST profile)

```
Done: <one line of what changed and where>
Checks: <command> -> <observed result (exit code / N passed)>; <command> -> BLOCKED (<why>)
Not verified: <anything without evidence>
Next: <what the user should do or decide>
```

## `evidence-table` format (BALANCED profile)

```
## What changed
- <file>: <what and why>  (keep to files you touched; list untouched dirty files separately)

## Acceptance criteria
| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | ... | VERIFIED | `npm test` -> 42 passed, 0 failed (exit 0) |
| 2 | ... | NOT VERIFIED | no test covers this path; manual check not performed |

## Checks run
| Command | Result |
|---|---|
| `pnpm test` | exit 0, 42 passed |
| `pnpm run lint` | BLOCKED: eslint not installed (`which eslint` -> missing) |

## Baseline
<pre-existing failures recorded before the change, or "clean">

## Risks and follow-ups
- ...
```

## `full` format (PRODUCTION profile)

Everything in `evidence-table`, plus:

```
## Scope and risk tier
<tier and why>

## Plan adherence
<deviations from the approved plan and why>

## Security review
<findings by severity with remediation or accepted-risk rationale; "no findings" must say what was examined>

## Independent review
<summary of the independent-reviewer agent's findings and how each was resolved, or "not run: <reason>">

## Documentation
<what was updated, or why nothing needed updating>

## Rollback
<how to revert safely>
```

Rules:

- Every TESTED/VERIFIED row names the command and the observed output. "Tests pass" without a command is NOT VERIFIED.
- BLOCKED rows name the missing tool, permission, or decision and the smallest step that unblocks.
- Pre-existing failures are listed under Baseline, never counted as regressions, and never silently fixed in an unrelated task.
- Do not include secrets, tokens, or full environment dumps in any report.
