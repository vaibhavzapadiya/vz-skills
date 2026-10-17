---
name: release
description: Release-readiness check and release preparation: full verification, changelog and version bump per the project's scheme, dependency and license review, rollback plan, and a go/no-go with evidence. Never publishes, tags, or pushes without the user's explicit instruction. Use when preparing a release, cutting a version, or asked "can we ship".
argument-hint: "[version or release scope]"
---

# Release readiness

Shipping is an external, hard-to-reverse action. This skill prepares and verifies; the user authorizes each outward step.

## Inputs

- Repository brief: versioning scheme (package manifest version, tags, `CHANGELOG`), release tooling (semantic-release, changesets, release-please, `npm version`, `cargo release`, GitHub Actions release workflows), CI status if visible.
- The set of changes since the last release: the last tag is `git describe --tags --abbrev=0` and the range is `<last-tag>..HEAD`; with no tags, ask the user for the starting commit, and the profile (PRODUCTION rigor recommended regardless of profile).

## Workflow

1. **Freeze scope.** List commits/PRs since the last release; flag anything unreviewed, untested, or marked WIP. Confirm the working tree is clean or that dirty files are intentionally excluded.
2. **Run full verification** via `/vz-skills:verify` with `verification.depth: exhaustive` semantics: full tests, lint, typecheck, build/package in release configuration. Record every command and result. A red check is a no-go unless the user explicitly accepts it as known.
3. **Security and dependencies**: run the ecosystem audit if CONFIRMED available (`npm audit`, `pip-audit`, `cargo audit`, `dotnet list package --vulnerable`); review new dependencies and their licenses against the project's policy if one exists; note NOT VERIFIED when no tool is available.
4. **Version and changelog**: propose the next version per the scheme (semver from the change classes: breaking -> major, features -> minor, fixes -> patch); draft the changelog entry from the commit list, grouped and user-facing; update the version in the manifest only with the project's own command or edit, and only when the user confirms the number. Use forms that neither commit nor tag (`npm version <v> --no-git-tag-version`, `changeset version`); a bump command must never create the commit or tag on its own.
5. **Artifacts**: build the release artifact locally if the project has a packaging step; inspect its contents (no secrets, no local paths, no test fixtures, correct files included); record size and checksum.
6. **Rollback plan**: how to revert (previous version pin, tag, migration down path, feature flag); what is irreversible (published packages, migrations).
7. **Go/no-go** with the evidence table. Then stop. Tagging, pushing, publishing, deploying, or creating a GitHub release happen only when the user says so in this conversation, one step at a time, and each is reported with its exact command and result.

## Rules

- `git tag`, `git push`, `npm publish`, `gh release create`, deploy commands: ask first, every time (the command guard also asks, but it is advisory). `approvals.external_actions: refuse` means never run them; hand the commands to the user instead.
- Never force-push or rewrite history as part of a release.
- Do not bump versions in multiple places by hand if the project has a single source of truth.

## Output

```
Release: <version candidate>  Scope: <n commits since <tag>>
Verification: <command -> result> ... (all green | failures: ...)
Audit/licenses: <result or NOT VERIFIED>
Changelog: drafted at <file> (pending confirmation)
Artifact: <path, size, checksum> | n/a
Rollback: ...
Decision: GO | NO-GO (<reasons>)
Awaiting user: confirm version, then authorize tag/push/publish steps individually
```

## Validation scenarios

- Tests green but `npm audit` unavailable offline -> decision GO with "audit NOT VERIFIED" stated, not hidden.
- A commit since the last tag lacks review -> NO-GO or explicit user acceptance recorded.
