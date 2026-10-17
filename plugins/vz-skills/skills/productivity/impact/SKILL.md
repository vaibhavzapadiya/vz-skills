---
name: impact
description: Read-only impact analysis before changing a function, file, endpoint, config key, or table: callers with file:line, covering tests, public exposure, change history, and risk tier. Use before refactoring shared code or when asked what a change would break.
argument-hint: "<symbol, file, route, config key, or table>"
---

# Impact analysis

## Inputs

- The target (`$ARGUMENTS`): a symbol, file, route, config key, or table. Ambiguous names: list the candidates and ask which.
- Discovery output for the language, layout, and test locations.

## Workflow

1. **Find the definition**: Grep for the declaration (`function name`, `class Name`, `def name`, `export const name`, route path string, config key, table name in migrations or models). Confirm by reading it.
2. **Find the users**: word-boundary Grep across source, tests, scripts, and config for the name and its import path. Separate: direct callers, importers that re-export it, dynamic uses (string-based lookups, reflection, dependency injection names) that a text search may miss. Report counts and the first 15 with `path:line`.
3. **Find the tests**: test files that reference it directly, and tests that exercise its callers. Note when coverage is indirect only.
4. **Check exposure**: is it exported from the package entry (`package.json` `exports`/`main`, `__init__.py`, `pub` in `lib.rs`), part of an HTTP/GraphQL/RPC surface, a CLI flag, an environment variable, a persisted format (DB column, file, message schema), or used by another repository? Public exposure means a breaking-change review (`api-design`).
5. **Check history**: `git log --follow --format="%h %ad %s" --date=short -n 20 -- <file>` for how often it changes and recent related work; `git log -S <name> --oneline -n 10` for when it was introduced or last renamed.
6. **Rate the risk** with `${CLAUDE_PLUGIN_ROOT}/references/risk-tiers.md`.

## Output

```
Impact: <target> (<path:line>)
Users: <n> direct, <n> re-exports, <n> possible dynamic uses (listed)
Tests: <files> | indirect only | none
Exposure: internal | public API | persisted format | CLI/env
History: <n> changes in <period>; last: <hash date subject>
Risk: low | medium | high - <one-line reason>
Safe approach: <for example: add the new parameter as optional, update callers, then make it required>
Not checked: <what text search cannot see>
```

## Rules

- Read-only: no edits, and no commands beyond Grep/Read and read-only `git log`.
- A text search is not a type checker; say when a typed language's own tool (for example "find references" in the language server, `tsc`, `go vet`) would be more precise, and that it was not run.
