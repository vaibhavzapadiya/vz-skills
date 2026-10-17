# VZ Skills catalog

Generated from the plugin frontmatter by `node scripts/gen-catalog.js`; do not edit by hand. Groups are the folders under `plugins/vz-skills/skills/`. Invoke any skill as `/vz-skills:<name>` after a plugin install, or as `/<name>` after `npx vz-skills install --flat` (where `status` is `/vz-status`). Skills marked *user-run* have `disable-model-invocation: true` and are never auto-loaded by Claude.

## Entry points (`skills/entry/`)

| Skill | Invocation | Description |
|---|---|---|
| `discover` | `/vz-skills:discover` `[path] [--baseline]` | Discover a repository's stack, package manager, build/test/lint commands, CI, layout, project instructions, and git state with evidence labels (CONFIRMED / INFERRED / UNKNOWN / CONFLICTING). Use before planning or changing an unfamiliar repository, when asked "what is this project", or when a command to run is uncertain. |
| `learn-conventions` | `/vz-skills:learn-conventions` `[area, e.g. tests, api, all]` | Measure the repository's real coding conventions (naming, layout, errors, logging, tests, commits) with evidence counts, and on request save them to conventions.notes. Use in an unfamiliar repository or when Claude's output does not match the team's style. |
| `setup` | `/vz-skills:setup` `[FAST|BALANCED|PRODUCTION]` (user-run) | Configure VZ Skills for the current repository by creating .vz-skills/config.json with a chosen profile (FAST, BALANCED, PRODUCTION), explaining the effective settings, and never overwriting existing configuration or project instructions. |
| `status` | `/vz-skills:status` (user-run) | Show the VZ Skills state for this repository: effective profile and settings with their sources, configuration errors or safety-override warnings, hook status, and a brief repository discovery with git state. Read-only diagnostic. |

## Lifecycle (`skills/lifecycle/`)

| Skill | Invocation | Description |
|---|---|---|
| `clarify` | `/vz-skills:clarify` `[task description]` | Turn a vague or ambiguous task into explicit acceptance criteria, scope boundaries, and stated assumptions before planning or coding. Use when a request could be built more than one way, when "done" is undefined, or when the profile requires confirmation before implementing. |
| `debug` | `/vz-skills:debug` `[error message, failing test, or symptom]` | Diagnose a bug, failing test, or error by reproducing it, forming and testing hypotheses against evidence, and finding the root cause before changing code. Use when something fails, behaves unexpectedly, or a test is red and the cause is not yet known. |
| `implement` | `/vz-skills:implement` `[slice or task]` | Implement a change in small verified slices following repository conventions, preserving uncommitted user work, and running the narrowest relevant check after each step. Use when acceptance criteria (and a plan, if the profile requires one) exist and it is time to write code. |
| `plan` | `/vz-skills:plan` `[task or acceptance criteria]` | Produce a focused, risk-tiered implementation plan: ordered small slices with file paths, tests per slice, verification commands, and rollback. Use after acceptance criteria exist and the profile's planning.plan_when requires a plan for the change's risk tier, or whenever the user asks for a plan or spec. |
| `review` | `/vz-skills:review` `[diff target: staged | branch | PR number | path]` | Review a diff, branch, or pull request for correctness, scope, safety, and maintainability at the profile's review depth, producing ranked findings with file references. Use when asked to review a diff, branch, or PR, as the review step after `test` in the VZ lifecycle, or to get an independent second look via the independent-reviewer agent. For "is it done?" use `verify`. |
| `security-review` | `/vz-skills:security-review` `[diff target or module]` | Threat-model and security-review a change or module: trust boundaries, injection, authn/authz, secrets, crypto, data handling, dependencies, and agent-specific risks, with findings by severity and residual risk. Use for changes touching auth, payments, data, infra, or input parsing, when the profile's security.review_trigger fires, or when asked about security. |
| `test` | `/vz-skills:test` `[scope or test path]` | Choose and run the right tests for a change (targeted, affected, or full per profile), record baseline failures before changes, add missing tests for new behaviour, and report observed results with exact commands. Use after implementing, when asked to run or write tests, or to establish a baseline. |
| `using-vz-skills` | `/vz-skills:using-vz-skills` | Routes a development request to the right VZ Skills workflow (discover, clarify, plan, implement, test, debug, review, security-review, verify, or a specialist) and sets the rigor from the active profile. Use at the start of any non-trivial task in a repository, or when unsure which VZ skill applies. |
| `verify` | `/vz-skills:verify` `[task or criteria to verify]` | Final verification and evidence-based completion report: re-check every acceptance criterion, re-run the required checks, confirm untouched files are untouched, and label each claim IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED in the profile's report format. Use before telling the user a task is done, or when asked "is this finished". |

## Specialists (`skills/specialists/`)

| Skill | Invocation | Description |
|---|---|---|
| `adr` | `/vz-skills:adr` `[new <title> | supersede <number> | list]` | Create and maintain Architecture Decision Records in the repository's existing format and numbering: new, supersede or deprecate, and list. Use when a change makes a lasting technical decision, or when asked to record or review one. |
| `api-design` | `/vz-skills:api-design` `[endpoint or interface]` | Design or change a public interface (HTTP/REST, GraphQL, gRPC, SDK, CLI, library API) with explicit contracts, versioning, backwards compatibility, error semantics, and contract tests. Use when adding or modifying endpoints, request/response shapes, public functions, or CLI flags that other code or clients depend on. |
| `backend` | `/vz-skills:backend` `[service, handler, or job]` | Backend engineering checklist for services, handlers, jobs, and integrations: input validation, error handling, idempotency, transactions, observability, configuration, and tests within the discovered framework. Use from plan (or directly) when the change touches server-side code. |
| `database` | `/vz-skills:database` `[table, migration, or query]` | Database and schema change workflow: migrations that are reversible and backwards compatible, data backfills, index and query review, and safety around destructive operations, using the project's migration tool. Use when a change adds or alters tables, columns, indexes, constraints, or queries. |
| `deps` | `/vz-skills:deps` `[package name | outdated | audit | patch | minor | major]` | Upgrade or audit dependencies one at a time: release notes first, upgrade through the package manager (never by editing the lockfile), run the affected checks, roll back on failure. Use to update dependencies, fix audit findings, or upgrade a package or framework. |
| `docs` | `/vz-skills:docs` `[what to document]` | Write or update documentation that matches the code: README sections, setup and usage guides, API reference, architecture notes, ADRs, and changelog entries, verified against the actual commands and behaviour. Use when docs are part of a change (per the profile's documentation.expectation) or when asked to document something. |
| `frontend` | `/vz-skills:frontend` `[component or page]` | Frontend engineering checklist for UI components, pages, state, styling, accessibility, and client-side performance within the discovered framework and conventions. Use from plan (or directly) when the change touches user interface code (React, Vue, Svelte, Angular, plain DOM, CSS). |
| `performance` | `/vz-skills:performance` `[symptom or code path]` | Investigate and improve performance with measurements first: reproduce the slow path, profile or time it, find the dominant cost, change one thing, and re-measure. Use when something is slow, when asked to optimize, or when a change touches hot paths, queries, or caching. |
| `prove-test` | `/vz-skills:prove-test` `[test file or test name]` | Prove a new or changed test actually tests the change by running it without the change in a temporary git worktree: it must fail there and pass with the change. Use after writing tests for a bug fix or new behaviour, or when a test's value is in doubt. |
| `release` | `/vz-skills:release` `[version or release scope]` | Release-readiness check and release preparation: full verification, changelog and version bump per the project's scheme, dependency and license review, rollback plan, and a go/no-go with evidence. Never publishes, tags, or pushes without the user's explicit instruction. Use when preparing a release, cutting a version, or asked "can we ship". |

## Productivity (`skills/productivity/`)

| Skill | Invocation | Description |
|---|---|---|
| `checkpoint` | `/vz-skills:checkpoint` `[save | resume | show]` | Save the state of a long task to .vz-skills/checkpoint.md (criteria, slices with status labels, last commands and results, blockers, exact next action) and resume from it in a new session after verifying it still matches the repository. Use before context runs out, before ending a session mid-task, or when asked to continue earlier work. |
| `commit` | `/vz-skills:commit` `[message hint]` | Commit the current task's changes safely: stage only this task's files by name, check the staged diff for secrets, write the message in the repository's style, and never skip git hooks. Use when the user asks to commit. |
| `dashboard` | `/vz-skills:dashboard` `[output path]` | Generate a one-page HTML project dashboard from the repository's real state: settings, stack and commands, git, decision records, the current task, the AI activity ledger, and docs. Use for "where do we stand", a status overview, or before a handover. |
| `explain` | `/vz-skills:explain` `[path, symbol, diff target, or question]` | Explain a module, file, function, diff, or error to a human reader (a new teammate, a reviewer, or yourself) with file:line references, the data flow, the reasons behind the design as far as the code and history show them, and explicit unknowns. Read-only. Use when asked how something works, what a change does, or why a piece of code exists. |
| `impact` | `/vz-skills:impact` `<symbol, file, route, config key, or table>` | Read-only impact analysis before changing a function, file, endpoint, config key, or table: callers with file:line, covering tests, public exposure, change history, and risk tier. Use before refactoring shared code or when asked what a change would break. |
| `ledger` | `/vz-skills:ledger` `[last | all | <session id>]` | Show what Claude actually edited and ran in this project, and which checks passed or failed, from the activity ledger the plugin records. Use for "what did you change or run", a session audit, or to confirm a check really ran. |
| `onboard` | `/vz-skills:onboard` `[audience or focus, e.g. backend, new hire]` | Write a one-page onboarding guide from the repository's real state: how to install, run, and test it, the code map, the main flows with file:line, conventions, and where to start. Use to onboard a developer or when a repository lacks a getting-started guide. |
| `pr` | `/vz-skills:pr` `[base branch] [--create]` | Write a pull request title and description from the evidence gathered during a task (what changed, acceptance criteria with status, checks run with results, baseline failures, risks, rollback, what is NOT VERIFIED), and only create or push the PR when explicitly asked. Use when a change is ready for review or when asked for a PR description. |
| `retro` | `/vz-skills:retro` `[task or time window]` | After a task, review what slowed the work or weakened confidence (unknown commands, missing tests, flaky checks, unclear conventions, blocked tools) and turn each into a concrete, small improvement to the repository or its VZ configuration, proposed but not applied. Use at the end of a task, after a painful debugging session, or when asked how to make the repo easier to work in. |
| `standup` | `/vz-skills:standup` `[since: e.g. yesterday, 2 days ago, a commit]` | Produce a short, factual "what changed, what is in progress, what is blocked" summary from git history, the working tree, and the latest checkpoint, for a daily update or a handover. Use when asked what happened recently, for a status update, or at the start of a day on a repository. |

## Agents

| Agent | Model | Tools | Description |
|---|---|---|---|
| `vz-skills:independent-reviewer` | inherit | Read, Glob, Grep | Fresh-context, read-only code reviewer that checks a diff against stated acceptance criteria and the VZ review checklist, returning ranked findings with file:line references. Use when the profile requests an independent review (review.independent_reviewer) or the change is medium/high risk, so the review is not anchored on the author's own reasoning. |
| `vz-skills:repo-analyst` | sonnet | Read, Glob, Grep | Read-only repository analyst that maps architecture, entry points, data flow, conventions, and test coverage for a stated question or task area, returning a grounded summary with file references and explicit unknowns. Use when the main conversation needs a broad codebase survey without filling its context with file dumps. |
| `vz-skills:security-reviewer` | inherit | Read, Glob, Grep | Read-only security reviewer that threat-models a change and checks it for injection, authentication and authorization gaps, secret exposure, unsafe file/shell/network handling, and risky dependencies, returning findings by severity with residual risk. Use for high-risk changes (auth, payments, data, infra, parsing) or when the security-review skill delegates. |

## Hooks

| Event | Matcher | Script | Timeout (s) |
|---|---|---|---|
| PreToolUse | `Bash|PowerShell` | `scripts/hooks/command-guard.js` | 10 |
| PreToolUse | `Write|Edit|MultiEdit|NotebookEdit` | `scripts/hooks/write-guard.js` | 10 |
| SessionStart | `startup|resume|clear|compact` | `scripts/hooks/session-context.js` | 20 |
| PostToolUse | `Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell` | `scripts/hooks/ledger.js` | 5 |
| PostToolUseFailure | `Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell` | `scripts/hooks/ledger.js` | 5 |
| Stop | `*` | `scripts/hooks/claim-check.js` | 10 |

Total: 33 skills in 4 groups, 3 agents, 5 hooks on 5 events.
