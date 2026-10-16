# VZ Skills — Final Independent Audit

Act as an independent release auditor. Do not merely trust implementation notes or previous claims.

## Inspect
- actual repository tree and git diff/status;
- current official Claude Code requirements relevant to shipped features;
- plugin/package structure, skills, commands, hooks, agents, config, and docs;
- tests and their actual outputs;
- install/update/uninstall steps;
- licenses, attribution, dependencies, and release metadata.

## Verify
1. Every shipped feature maps to a requirement and has an acceptance result.
2. Every `VERIFIED` status has specific evidence.
3. No test is reported as passed without observed execution.
4. No stale docs, fake placeholder implementations, or unsupported claims remain.
5. User changes and local instructions were preserved.
6. Configuration errors are clear and safety-relevant settings cannot be silently weakened.
7. Hooks are valid, proportionate, and not represented as security boundaries.
8. Adversarial input, secret handling, unsafe shell execution, and destructive action risks are addressed.
9. The package can be installed/tested using documented, verified steps.
10. Deferred items and known issues are explicit.

## Output
Update `docs/project/acceptance-matrix.md`, `docs/project/progress.md`, `docs/project/known-issues.md`, and release docs. Produce a report with:
- verified requirements and evidence;
- tests run and results;
- tests not run and reasons;
- security findings and residual risks;
- installation verification;
- known issues/deferred work;
- honest release recommendation: READY, READY WITH LIMITATIONS, or NOT READY.

Do not alter the project merely to make the audit appear green. Fix real defects where feasible, retest, and report remaining gaps accurately.
