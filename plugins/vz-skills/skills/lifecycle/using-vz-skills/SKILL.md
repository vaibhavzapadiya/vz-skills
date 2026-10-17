---
name: using-vz-skills
description: Routes a development request to the right VZ Skills workflow (discover, clarify, plan, implement, test, debug, review, security-review, verify, or a specialist) and sets the rigor from the active profile. Use at the start of any non-trivial task in a repository, or when unsure which VZ skill applies.
---

# Using VZ Skills

VZ Skills is a set of small workflows. This skill picks the path; it does not do the work.

## 1. Establish context (30 seconds)

- Read the session-start brief (profile summary and repository brief injected by the plugin). If it is missing (for example `hooks.session_context: false`), run `node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-config.js" --summary --project .` to get the profile; `/vz-skills:status` is user-run, so suggest it rather than invoking it.
- If the repository brief is missing or stale, or the task depends on build/test commands, run `/vz-skills:discover` first.
- Note the effective profile: **FAST**, **BALANCED**, or **PRODUCTION**. Every downstream skill reads the resolved fields (planning, testing, review, security, response) from that summary.

## 2. Classify the request

| Request looks like | Route | Notes |
|---|---|---|
| "What is this repo / how do I run it" | `discover` | Read-only. |
| Vague feature or change request | `clarify` -> `plan` -> `implement` -> `test` -> `review` -> `verify` | The core lifecycle. Skip `clarify` only when criteria are already explicit and `clarification.ambiguity_tolerance` is `high`. |
| Clear, small change (risk tier low) | `implement` -> `test` -> `verify` | No plan needed unless `planning.plan_when` is `always` or `risk>=low`. |
| Bug report / failing test / error | `debug` -> `implement` -> `test` -> `verify` | Root cause before fix. |
| "Review this diff/PR" | `review` (+ `security-review` if the trigger applies) | Read-only unless asked to fix. |
| Anything touching auth, payments, migrations, infra, secrets | add `security-review`; treat as **high** risk | See `${CLAUDE_PLUGIN_ROOT}/references/risk-tiers.md`. |
| "Is it slow / optimize" | `performance` | Measure first. |
| UI/component/accessibility work | `frontend` (inside the lifecycle) | |
| Service/handler/job work | `backend` (inside the lifecycle) | |
| Schema/migration/query work | `database` (inside the lifecycle) | |
| New or changed public API | `api-design` (inside `plan`) | |
| Docs/README/ADR | `docs` | |
| "Ready to ship / release / cut a version" | `release` | Checklist, no publishing without authorization. |
| Configure VZ for this repo | `/vz-skills:setup` | User-run. |
| Context is running out / "continue where we left off" | `checkpoint` | Save before stopping; resume verifies the file against the repository first. |
| "Open a PR / write the PR description" | `pr` | Built from the `verify` evidence; creates nothing without an explicit request. |
| "What happened / status update / handover" | `standup` | Read-only summary from git, working tree, checkpoint. |
| "How does X work / explain this diff" | `explain` | Read-only, `file:line` references, unknowns stated. |
| "What slowed us down / how to make this repo easier" | `retro` | Proposes small improvements with evidence; applies nothing. |

Skills are invoked as `/vz-skills:<name>`. Invoke them explicitly rather than paraphrasing their content.

## 3. Set the rigor

Read these fields from the profile summary and pass them forward:

- `planning.plan_when` and `planning.depth` -> whether and how much to plan.
- `testing.strategy`, `testing.require_baseline`, `testing.tdd` -> what the `test` skill must run.
- `review.depth`, `review.independent_reviewer` -> self-review vs delegated review.
- `security.review_trigger` -> whether `security-review` runs.
- `response.final_report` -> report shape in `verify`.
- `agents.delegation` -> whether to use `repo-analyst`, `independent-reviewer`, `security-reviewer`.

Never lower rigor below the profile. Raise it when the risk tier is high.

## 4. Hand off

State the route in one line ("Route: clarify -> plan -> implement -> test -> verify; profile BALANCED; risk medium") and invoke the first skill. Each skill ends by naming the next one.

## Non-goals

- Do not re-explain the core policy; it is already in context.
- Do not invent commands; unknowns go back to `discover`.
- Do not chain every skill for a one-line change: the table above is a floor, not a ritual.
