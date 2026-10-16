# Review checklist

Apply in order; stop early for `review.depth: quick` after section 1, do sections 1-3 for `standard`, all for `thorough`.

## 1. Correctness (always)
- Does the diff do what the acceptance criteria say, and nothing else? List any change not traceable to a criterion.
- Edge cases: empty input, null/undefined, boundaries (0, 1, max), unicode, very large input, concurrent calls, time zones, retries.
- Error paths: are failures surfaced, logged without secrets, and not swallowed? Are partial writes rolled back?
- Does every new code path have a test, or an explicit NOT VERIFIED note?

## 2. Safety and scope
- Untouched dirty files remain untouched. No unrelated formatting churn.
- No secrets, credentials, or internal URLs added. No `.env` edits.
- No new network calls, shell executions, or file writes outside what the task needs.
- Destructive operations (deletes, migrations, overwrites) are guarded and reversible or documented as irreversible.

## 3. Design and maintainability
- Follows discovered conventions (naming, layout, error handling, logging) rather than importing another ecosystem's habits.
- No duplicated logic that an existing helper already covers (search before adding).
- Public interfaces: backwards compatible, or the break is called out with a migration note.
- Complexity proportionate to the problem; no speculative abstractions.

## 4. Thorough extras
- Performance: obvious N+1s, unbounded loops, allocation in hot paths, missing indexes for new queries.
- Observability: errors and key decisions are logged/traced at the right level, without PII.
- Docs: public behaviour changes reflected in README/docs/changelog per `documentation.expectation`.
- Dependency changes: license, maintenance status, lockfile updated by the package manager (not by hand).

## Reporting findings
Rank by severity: **blocker** (must fix before done), **major** (should fix now), **minor** (note or follow-up). Each finding: file:line, what is wrong, why it matters, concrete fix. "Looks good" must say what was examined.
