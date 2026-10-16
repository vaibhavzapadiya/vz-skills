# Release Readiness Checklist

Completed 2026-10-16 for VZ Skills 0.1.0. Evidence: `project/PROGRESS.md`, `docs/release-audit.md`.


## Compatibility and package
- [x] Current Claude Code docs reviewed.
- [x] Supported version/compatibility stated.
- [x] Package layout and metadata validated.
- [x] No unsupported fields or stale examples.
- [x] No accidental secrets, local paths, or generated artifacts in release contents.

## Functionality
- [x] Every shipped skill has distinct purpose and validation.
- [x] Every shipped command works and is documented. (structure + scripts TESTED; live invocation NOT VERIFIED, KI-002)
- [x] Every shipped hook is justified and tested.
- [x] Every shipped agent has a distinct contract and evidence of value. (contracts documented; live value NOT VERIFIED, KI-002)
- [x] Configuration and profiles are validated and tested.
- [x] Repository discovery fixture matrix completed or gaps disclosed.

## Safety and security
- [x] Existing user work preservation reviewed.
- [x] Malicious repository instructions tested.
- [x] Secret-handling and destructive-action behavior reviewed.
- [x] Hook limitations clearly stated.
- [x] No unsupported security guarantees.

## Quality
- [x] Relevant tests run.
- [x] Regression suite run.
- [x] Failures resolved or explicitly documented.
- [x] No fake test output or unsupported metrics.
- [x] Acceptance matrix reflects evidence.

## Documentation and release
- [x] README quick start verified.
- [x] Install/update/rollback/uninstall instructions checked. (session-only path observed; marketplace path documented, NOT_RUN, KI-004)
- [x] Troubleshooting and known limitations documented.
- [x] License/attribution/dependency inventory reviewed. (MIT, DEC-010)
- [x] Changelog/release notes prepared.
- [x] Final audit report completed.
- [x] Release recommendation: **READY WITH LIMITATIONS** (see docs/release-audit.md).
