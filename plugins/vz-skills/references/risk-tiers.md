# Change risk tiers

Used by `plan`, `implement`, `review`, `security-review`, and `verify` to scale effort. Pick the **highest** tier that applies; when unsure, go one tier up.

| Tier | Typical changes | Required before "done" |
|---|---|---|
| **low** | Docs, comments, log messages, test-only changes, formatting, isolated pure functions with existing tests, config values with no security effect | Narrowest relevant check runs green (or is reported BLOCKED with reason). |
| **medium** | New feature behind existing interfaces, bug fixes in business logic, refactors inside one module, new endpoints without auth changes, dependency bumps (minor) | Plan if the profile requires it (`planning.plan_when`), affected tests run, self-review against `review-checklist.md`. |
| **high** | Auth/authz, session or token handling, payments/billing, cryptography, input parsing at trust boundaries, data migrations, deletes, concurrency, caching with invalidation, CI/CD and infra, dependency bumps (major), anything touching secrets | Written plan always, baseline tests run, full test strategy for the affected area, security review, independent review when `review.independent_reviewer` is `auto` or `always`, full evidence report. |

Signals that force **high** regardless of size: file paths matching `auth|login|session|token|secret|crypt|payment|billing|migration|schema|infra|deploy|docker|k8s|terraform|.github/workflows`, or `hooks.protected_paths` from `.vz-skills/config.json`.

Profile interaction:

- `planning.plan_when`: `risk>=high` (FAST), `risk>=medium` (BALANCED), `always` (PRODUCTION).
- `security.review_trigger`: `sensitive-paths` only runs the security review for high-tier paths; `material-changes` adds every medium/high change; `always` runs it for every change.
