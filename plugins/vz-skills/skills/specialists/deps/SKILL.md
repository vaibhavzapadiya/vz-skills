---
name: deps
description: Upgrade or audit dependencies one at a time: release notes first, upgrade through the package manager (never by editing the lockfile), run the affected checks, roll back on failure. Use to update dependencies, fix audit findings, or upgrade a package or framework.
argument-hint: "[package name | outdated | audit | patch | minor | major]"
---

# Dependency upgrades

One package per step, each with its own verification, so a failure points at one change.

## Inputs

- Discovery: package manager (CONFIRMED), lockfile, test, lint, typecheck, build commands.
- `$ARGUMENTS`: a package name, `outdated` (list only), `audit` (security findings first), or a range limit (`patch`, `minor`, `major`; default `minor`, and majors only when named or asked for).
- Profile and `approvals.run_project_scripts` (installs and checks run project tooling; core policy 7).

## Workflow

1. **Inventory (read-only)** with the ecosystem's own command: `npm outdated --json`, `pnpm outdated`, `yarn outdated`, `pip list --outdated`, `uv pip list --outdated`, `poetry show --outdated`, `cargo outdated` (if installed), `go list -m -u all`, `dotnet list package --outdated`, `bundle outdated`. Add the audit: `npm audit --json`, `pip-audit`, `cargo audit`, `dotnet list package --vulnerable`. A tool that is not installed is NOT VERIFIED; do not install it globally.
2. **Plan the order**: security fixes first, then patch, then minor, then majors one at a time. Group only packages that must move together (for example `react` and `react-dom`, `@types/x` with `x`). Show the plan and wait for the user's go-ahead before changing anything.
3. **For each step**:
   1. Read what changes: the package's CHANGELOG or release notes for every version in the range (from the package's repository or registry page). List breaking changes and deprecations that touch code this repository uses (Grep for the APIs mentioned).
   2. Upgrade with the package manager: `npm install <pkg>@<version>`, `pnpm add`, `pip install` plus the project's lock/compile step, `poetry add`, `cargo update -p`, `go get`, `dotnet add package`, `bundle update --conservative`. Never hand-edit a lockfile.
   3. Fix code only for the documented breaking changes, through `implement`.
   4. Verify: install from the lockfile, then typecheck, build, and the tests that import the package (`affected` scope at least; `full` for majors and frameworks).
   5. Record: package, from, to, notes read, code changes, commands with results. On failure, revert that step by reinstalling the previous version with the package manager, and report.
4. **Majors and frameworks**: a major upgrade of a core dependency (framework, ORM, language runtime) is a lasting decision: propose an ADR (`/vz-skills:adr`) and a plan (`/vz-skills:plan`) before starting.

## Output

```
| Package | From | To | Breaking changes affecting us | Checks | Result |
Skipped: <package> (<reason: major not requested, needs ADR, tool missing>)
Audit: <before> -> <after> | NOT VERIFIED (<why>)
```

## Rules

- Never add a new dependency in this skill, and never remove one without the user's say-so.
- Lockfile changes come only from the package manager; the write guard asks before hand edits.
- Global installs, `--force`, and `--legacy-peer-deps` need the user's explicit approval and a stated reason.
- Commit only when asked, one commit per upgraded package or group (`/vz-skills:commit`).

## Validation scenarios

- `npm audit` reports a high finding with a patch release: upgraded first, tests run, finding gone in the re-run audit.
- A major release removes an API the code uses: listed under breaking changes, ADR proposed, nothing changed until the user agrees.
