# Tracker Status Definitions

- `NOT_STARTED`: no implementation work has begun.
- `IN_PROGRESS`: work is underway; exit criteria are not yet satisfied.
- `BLOCKED`: work cannot proceed due to a recorded dependency or decision.
- `IMPLEMENTED`: implementation exists; tests may not have run.
- `TESTED`: relevant checks were run and observed; this does not automatically mean all acceptance criteria are satisfied.
- `VERIFIED`: acceptance criteria are satisfied with linked evidence.
- `DEFERRED`: intentionally postponed with rationale, impact, and reconsideration trigger.
- `REJECTED`: explicitly decided not to implement, with rationale.

Test-case outcome labels:
- `PASS`: executed and passed.
- `FAIL`: executed and failed.
- `BLOCKED`: could not execute due to a specific constraint.
- `NOT_RUN`: not executed.
