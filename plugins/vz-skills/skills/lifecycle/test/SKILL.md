---
name: test
description: Choose and run the right tests for a change (targeted, affected, or full per profile), record baseline failures before changes, add missing tests for new behaviour, and report observed results with exact commands. Use after implementing, when asked to run or write tests, or to establish a baseline.
argument-hint: "[scope or test path]"
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-discover.js" *)
---

# Test strategy and execution

Never claim a result you did not observe. A test that was not run is NOT VERIFIED.

## Inputs

- Repository brief: `commands.test` (with label), test frameworks, `tests.runner_available`, `baseline`.
- Profile: `testing.strategy` (targeted | affected | full), `testing.require_baseline`, `testing.require_new_tests_for_new_behavior`, `testing.tdd`.
- The change set (`git diff --name-only`, plus untracked new files).

## Workflow

1. **Confirm the command.** Use `commands.test` only if CONFIRMED or INFERRED with a stated basis. If UNKNOWN: look for CONTRIBUTING/README instructions, then try the ecosystem's collection or dry-run command once (for example `pytest --collect-only -q`; it imports test modules, so it counts as running project code under `approvals.run_project_scripts`) and record what happened. Still unknown -> BLOCKED.
2. **Baseline** (when `testing.require_baseline` is true, or the risk tier is high): use the baseline that `implement` step 0 or `/vz-skills:discover --baseline` recorded before the first edit. Record its failing test names; only those are pre-existing. If no baseline was recorded and files have already been edited in this task, do **not** take one now (it would include this change's failures): report the baseline NOT VERIFIED and treat every failure as possibly caused by this change. `git stash` to get a clean tree is not allowed.
   - Command: `node "${CLAUDE_PLUGIN_ROOT}/scripts/vz-discover.js" . --run-baseline --format md` runs only allowlisted test commands.
3. **Select scope** by `testing.strategy`:
   - `targeted`: the test files for the changed units (same name, same directory, or matching `*.test.*`/`test_*`).
   - `affected`: targeted plus tests that import/reference the changed modules (Grep for the module path or exported names in test dirs).
   - `full`: the whole suite, plus lint and typecheck if CONFIRMED.
   Always run at least targeted scope; raise scope for high-risk tiers regardless of profile.
4. **Fill gaps.** If `require_new_tests_for_new_behavior` is true and a changed behaviour has no test, write one in the repository's existing style (framework, location, naming). If no framework exists, propose the ecosystem default for the stack and ask before adding a dependency; without approval, record NOT VERIFIED.
5. **Run and observe.** Execute the chosen commands with their real output. Capture: command, exit code, counts (passed/failed/skipped), failing test names, and duration if shown. Do not truncate failure messages that explain the cause.
6. **Classify each failure**: pre-existing (in baseline), caused by this change (fix it, or undo it by editing it back; core policy 3), environmental (missing service/tool -> BLOCKED with the exact reason), flaky (re-run once; report both results).
7. **Report** in a table: command, scope, result, status. End with `Next: review` or `Next: debug <failure>`.

## Rules

- Never edit or delete a test to make it pass unless the test itself is wrong, and then say why with evidence.
- Never run the full suite of a huge monorepo when `affected` is the profile and the change is local; never run only one file when the profile says `full`.
- Running any project command follows `approvals.run_project_scripts` (core policy 7): with `refuse`, report every check BLOCKED; with `ask`, name each command and wait for a yes.
- Tests that need credentials, networks, or external services: run only if the environment clearly provides them; otherwise BLOCKED, not skipped silently.

## Failure behaviour

- Runner not installed (`tests.runner_available: false`): report BLOCKED with the missing executable and the install hint from the manifest; do not install globally.
- Test command exits non-zero without test output (config error): quote stderr, treat as BLOCKED, and suggest the fix.

## Validation scenarios

- failing-tests fixture: baseline FAIL recorded with the failing test name; a later unrelated change is not blamed for it.
- missing-tool fixture: BLOCKED with "vz-nonexistent-runner-zz not on PATH".
- no-tests fixture: reports no suite, proposes `node --test` with a new `test/` file, and labels behaviour NOT VERIFIED until that exists.
