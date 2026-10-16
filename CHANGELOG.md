# Changelog

All notable changes to VZ Skills are recorded here. The format follows Keep a Changelog; versions follow semver and match `plugins/vz-skills/.claude-plugin/plugin.json`.

## [0.1.0] - 2026-10-16

First implementation, built from the specification kit against Claude Code 2.1.259 and the official documentation accessed on 2026-10-16.

### Added
- Plugin `vz-skills` with manifest, local marketplace `vz-skills-marketplace`, and standard layout validated by `claude plugin validate --strict`.
- Repository discovery engine (`scripts/vz-discover.js`, `lib/discover.js`): Node/TypeScript, Python, Go, Rust, .NET, JVM, Ruby, PHP, Makefile, CI, monorepo, instruction-file and injection-indicator scanning, git state, tool availability, allowlisted baseline runs, safe cache, JSON and Markdown output.
- Configuration system (`scripts/vz-config.js`, `lib/config.js`): schema v1, FAST/BALANCED/PRODUCTION presets, precedence, safety floors with acknowledged overrides, typo suggestions, path safety, `--init/--explain/--validate/--schema/--profiles`.
- 19 skills: setup, status, discover, using-vz-skills, clarify, plan, implement, test, debug, review, security-review, verify, performance, frontend, backend, database, api-design, docs, release.
- 3 read-only agents: repo-analyst, independent-reviewer, security-reviewer.
- 3 hooks (exec-form Node, fail-open): command guard, write guard, session context; shared core policy.
- References: risk tiers, review checklist, security checklist, report template.
- Test suite (`node:test`, no dependencies): structure, config, discovery fixture matrix (13 fixtures), hooks, platform integration with the real CLI; eval suite with three read-only cases.
- Documentation: install, configuration, catalog (generated), hooks, agents, security, architecture, testing and evaluation, troubleshooting, contributing, research register and gap analysis.
- Release packaging script with archive integrity verification.

### Fixed during development (regression-tested)
- Nested test runners inherited `NODE_TEST_CONTEXT` and masked failures in baseline runs.
- Write guard's test-artifact exemption matched absolute paths.
- Directory walker skipped `.github`.
- Release archive built with PowerShell `Compress-Archive` had backslash entry names (unusable on macOS/Linux); the packager now uses bsdtar and rejects any backslash entry, with a regression test.

### Known limitations
- `claude plugin eval` behaviour on CLI 2.1.259 is below the documented minimum; see `docs/testing-and-evaluation.md` for what was observed.
- Injection detection and command guarding are heuristic and advisory.
