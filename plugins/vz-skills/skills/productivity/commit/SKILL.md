---
name: commit
description: Commit the current task's changes safely: stage only this task's files by name, check the staged diff for secrets, write the message in the repository's style, and never skip git hooks. Use when the user asks to commit.
argument-hint: "[message hint]"
---

# Commit

A commit records the task's work and nothing else. The user's unrelated changes stay unstaged; the project's hooks are never skipped.

## Inputs

- The user's request to commit. Do not commit on your own initiative (`implement` step 8).
- Files changed by this task, from the slice reports, versus files that were already dirty at discovery (`git status --porcelain`).
- Style: `conventions.commit_style` (`project` = match `git log --oneline -15`; `conventional` = `type(scope): subject`; `freeform`) and `$ARGUMENTS` as a hint for the subject.

## Workflow

1. **Check the state.** Run `git status --porcelain` and `git branch --show-current`.
   - Merge or rebase in progress, or unresolved conflicts: stop and say so.
   - Detached HEAD (empty branch name): stop and ask which branch to commit on.
   - On the default branch (`git symbolic-ref --short refs/remotes/origin/HEAD`, without the `origin/` prefix) when the repository works through pull requests (a `.github/pull_request_template*`, a CONTRIBUTING note, or most of the last commits are merge commits): ask whether to create a branch first. Name it like the existing remote branches (`git branch -r`), for example `feat/<short-slug>`.
2. **Stage by name.** `git add -- <file> ...` for each file this task created or changed. Never `git add -A`, `git add .`, or `git commit -a`. A file the user had already modified before the task is staged only if the user says so; if your change and theirs are in the same file, say that the commit would include both and ask.
3. **Check the staged diff.** `git diff --cached --stat`, then:
   - secrets: `git diff --cached --name-only -G "(api[_-]?key|secret|token|password|BEGIN [A-Z ]*PRIVATE KEY)"`; read each hit and judge it. A real secret stops the commit; report the file and line, never the value (core policy 5);
   - files that should not be there: `.env`, build output, editor files, lockfiles you changed by hand, large binaries.
   Unstage anything that does not belong with `git restore --staged -- <file>`.
4. **Write the message.** Subject under 72 characters, imperative, in the configured style. A body only when the reason is not obvious from the subject: why the change was made, plus any breaking change or follow-up. Reference an issue only if the user or the branch name gave one. Never claim tests passed unless they ran after the last edit in this task.
5. **Commit and let hooks run.** `git commit -m "<subject>" [-m "<body>"]`. Never add `--no-verify`, `-n`, or `--no-gpg-sign`. If a hook fails, show its output, fix the cause through `implement`, stage again, and make a new commit attempt; do not bypass it.
6. **Report** `git log -1 --stat --format="%h %s"` and anything left unstaged on purpose.

## Rules

- Never amend, squash, or rebase commits that are already on a remote branch (`git branch -r --contains <commit>`), and never amend a commit the user made.
- Commit is local. Pushing is a separate step with its own explicit request (core policy 7).
- One logical change per commit. If the staged files cover unrelated changes, propose separate commits.

## Failure behaviour

- Nothing staged for this task (all changes are the user's): say so; commit nothing.
- `git config user.name` or `user.email` unset: stop and tell the user how to set it; do not set it yourself.
- A pre-commit hook rewrote files (formatter): review the rewrite, stage those files by name, and commit again.

## Validation scenarios

- The user has an unrelated dirty `notes.md`: it stays unstaged and is listed as left out.
- A staged `config.json` contains `"api_key": "sk-live-..."`: commit stopped, file and line reported, value not shown.
- A pre-commit lint hook fails: output shown, fix made, new commit; `--no-verify` never used.
