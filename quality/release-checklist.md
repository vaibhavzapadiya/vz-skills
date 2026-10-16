# Release Readiness Checklist

## Compatibility and package
- [ ] Current Claude Code docs reviewed.
- [ ] Supported version/compatibility stated.
- [ ] Package layout and metadata validated.
- [ ] No unsupported fields or stale examples.
- [ ] No accidental secrets, local paths, or generated artifacts in release contents.

## Functionality
- [ ] Every shipped skill has distinct purpose and validation.
- [ ] Every shipped command works and is documented.
- [ ] Every shipped hook is justified and tested.
- [ ] Every shipped agent has a distinct contract and evidence of value.
- [ ] Configuration and profiles are validated and tested.
- [ ] Repository discovery fixture matrix completed or gaps disclosed.

## Safety and security
- [ ] Existing user work preservation reviewed.
- [ ] Malicious repository instructions tested.
- [ ] Secret-handling and destructive-action behavior reviewed.
- [ ] Hook limitations clearly stated.
- [ ] No unsupported security guarantees.

## Quality
- [ ] Relevant tests run.
- [ ] Regression suite run.
- [ ] Failures resolved or explicitly documented.
- [ ] No fake test output or unsupported metrics.
- [ ] Acceptance matrix reflects evidence.

## Documentation and release
- [ ] README quick start verified.
- [ ] Install/update/rollback/uninstall instructions checked.
- [ ] Troubleshooting and known limitations documented.
- [ ] License/attribution/dependency inventory reviewed.
- [ ] Changelog/release notes prepared.
- [ ] Final audit report completed.
- [ ] Release recommendation: READY / READY WITH LIMITATIONS / NOT READY.
