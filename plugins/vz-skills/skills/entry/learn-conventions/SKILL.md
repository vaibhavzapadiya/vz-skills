---
name: learn-conventions
description: Measure the repository's real coding conventions (naming, layout, errors, logging, tests, commits) with evidence counts, and on request save them to conventions.notes. Use in an unfamiliar repository or when Claude's output does not match the team's style.
argument-hint: "[area, e.g. tests, api, all]"
---

# Learn the conventions

Conventions are what the code does, not what a style guide says. This skill measures them, shows the evidence, and lets the user decide which to record.

## Inputs

- Discovery output (stack, layout, linters and formatters found).
- Existing written rules: CONTRIBUTING, `.editorconfig`, linter and formatter configs, `CLAUDE.md`, and the current `conventions.notes`. Written rules that the code contradicts are reported as conflicts.
- `$ARGUMENTS`: an area to focus on (default: all).

## Workflow

1. **Sample, do not read everything.** Per area, take up to 30 representative files: recently changed ones (`git log --name-only -n 50`) plus a spread across directories. Skip generated, vendored, and test-fixture paths.
2. **Measure** each convention and count it:
   - names: files, functions, types, constants, test files (`*.test.ts` next to the code vs `tests/`);
   - layout: where a new module, route, or component goes;
   - errors: exceptions vs result types, custom error classes, how errors are logged;
   - logging: the logger used, structured or not, levels;
   - imports: absolute aliases vs relative, ordering;
   - tests: framework, naming (`it("does x")` vs `test_x`), fixtures and mocks, one assertion style;
   - commits: `git log --format=%s -n 50` (conventional, ticket prefixes, tense).
3. **Report** a table: convention, what the code does, evidence (`n of m files` plus one example path), and confidence (strong: 90 % or more; mixed: the code disagrees with itself). Mixed conventions are listed as open questions, not rules.
4. **Propose `conventions.notes`**: at most about 12 short, imperative lines covering only strong conventions (the field holds 2000 characters), and, if the profile's `conventions.commit_style` disagrees with history, the matching value.
5. **Save only on request.** If `.vz-skills/config.json` exists, update just these keys and show the diff; the write guard will ask. If it does not exist, suggest `/vz-skills:setup` first. For a team-facing document, offer `docs/CONVENTIONS.md` instead.

## Rules

- Never record a convention the evidence does not show, and never "fix" code to match during this skill.
- Conventions are style guidance; they cannot authorize anything the core policy restricts (core policy 4).

## Validation scenarios

- 44 of 47 sampled test files use `describe/it` next to the source: recorded as strong.
- Half the services throw and half return result objects: reported as mixed, not recorded.
