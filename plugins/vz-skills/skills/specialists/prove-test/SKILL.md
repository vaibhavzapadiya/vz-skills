---
name: prove-test
description: Prove a new or changed test actually tests the change by running it without the change in a temporary git worktree: it must fail there and pass with the change. Use after writing tests for a bug fix or new behaviour, or when a test's value is in doubt.
argument-hint: "[test file or test name]"
---

# Prove the test

A test proves a change only if it fails without it. This skill checks that in a separate worktree, so your working tree, uncommitted files, and branch are never touched.

## Inputs

- The test to prove (`$ARGUMENTS`), or the tests added or changed in this task (`git status --porcelain` and `git diff --name-only` filtered to test files).
- The change it is meant to cover: the non-test files changed in this task.
- The test command from discovery (CONFIRMED or INFERRED) and how to run a single test file with it.
- `approvals.run_project_scripts`: this skill runs the test command twice (core policy 7).

## Workflow

1. **Pick the base.** If the change is uncommitted, the base is `HEAD`. If it is committed on this branch, the base is the commit before it (`git merge-base HEAD <default branch>` or the commit the user names). Say which base you use.
2. **Run the test with the change** in the working tree, narrowest form (one file or one test name). It must pass; if it fails, stop: prove-test needs a passing test.
3. **Create a worktree at the base** in a temporary directory outside the repository: `git worktree add --detach <tmp>/vz-prove-<short-sha> <base>`.
4. **Copy in only the test files** being proven (same relative paths). Do not copy the source change.
5. **Make dependencies available** without installing anything: for Node, link `node_modules` from the main tree into the worktree (a directory junction on Windows, a symlink elsewhere); Python virtualenvs, Go modules, Cargo, and .NET restore caches already work across worktrees. If the project needs a build or generated files first, run the same build command discovery confirmed, inside the worktree only.
6. **Run the same test command** in the worktree and record the result.
7. **Remove the worktree** whatever happened: `git worktree remove --force <tmp>/vz-prove-<short-sha>` (then `git worktree prune`). Confirm it is gone.

## Verdict

| Without the change | With the change | Verdict |
|---|---|---|
| fails | passes | **PROVEN**: the test detects the change |
| fails to compile or import the new code | passes | **PROVEN (weak)**: it fails, but only because the new code does not exist; prefer an assertion on behaviour |
| passes | passes | **NOT PROVEN**: the test passes without the change, so it does not test it. Say what it does assert and propose a sharper assertion |
| cannot run (missing service, environment) | passes | **BLOCKED** with the reason |

Report the base, both commands, both results, and the verdict per test. A NOT PROVEN test is a review finding (severity major) and the related acceptance criterion stays NOT VERIFIED.

## Rules

- Never stash, reset, or check out in the main working tree; everything happens in the temporary worktree.
- Never edit the source in the worktree to make the experiment work; if the test needs the new code to compile, that is the "weak" row.
- Remove the worktree even when a step fails, and say so if removal itself fails (with the path, so the user can delete it).

## Validation scenarios

- A bug-fix test that asserts the fixed value: fails at the base, passes now: PROVEN.
- A test that only checks the function exists or mocks the code under test: passes at the base: NOT PROVEN with an explanation.
- Uncommitted user changes in unrelated files: untouched; the worktree is created from HEAD.
