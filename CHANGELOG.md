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

### Added (productivity skills)
- `checkpoint` (save/resume task state in `.vz-skills/checkpoint.md`, verified against the repository on resume), `pr` (PR title and description from the verify evidence; creates nothing without an explicit request), `standup` (done / in progress / blocked / next from git and the checkpoint), `explain` (read-only explanation with `file:line` references), `retro` (friction with evidence and one small fix per item, applied by nothing). Routed by `using-vz-skills`; listed under "Productivity" in the catalog. Skill count is now 24.

### Added (discovery coverage)
- Fixtures `ruby-app`, `php-app`, `maven-app`, `gradle-kotlin-app` with tests for the previously untested Ruby, PHP, Maven, and Gradle detectors (wrapper vs. bare tool, CONFIRMED vs. INFERRED labels, baseline-allowlist compatibility).
- Node discovery: when no `lint` script exists but an ESLint config is present (`eslint.config.*`, `.eslintrc*`, or `package.json#eslintConfig`), `commands.lint` is reported as INFERRED `<pm> exec eslint .` (`npx eslint .` for npm); a Prettier config (`.prettierrc*`, `prettier.config.*`, or `package.json#prettier`) likewise yields INFERRED `<pm> exec prettier --check .` for `commands.format`. The config file is the evidence and is named in the basis. Declared scripts still win, and a dependency without a config file stays UNKNOWN.

### Fixed during development (regression-tested)
- Nested test runners inherited `NODE_TEST_CONTEXT` and masked failures in baseline runs.
- Write guard's test-artifact exemption matched absolute paths.
- Directory walker skipped `.github`.
- A config value that failed validation could still appear in the effective configuration summary; rejected values are now never applied (regression-tested).
- Release archive built with PowerShell `Compress-Archive` had backslash entry names (unusable on macOS/Linux); the packager now uses bsdtar and rejects any backslash entry, with a regression test.

### Added (editor support)
- JSON Schema (draft-07) for `.vz-skills/config.json` at `plugins/vz-skills/schema/config.v1.schema.json`, generated from `SCHEMA` by `scripts/gen-config-schema.js` (`--check` enforced by tests and `prepack`). `--init` and `docs/examples/*.json` now reference it by relative path instead of the non-existent `https://vz-skills.local/config/v1.json`; `templateFor(profile, { configDir })` computes the path. Tests assert the schema covers every key and agrees with the resolver's per-file validation.

### Added (distribution)
- Unprefixed install: `npx vz-skills install --flat [--scope user|project|local]` places the skills, agents, runtime, and hooks into the Claude config or the project's `.claude/` so commands are `/<name>` instead of `/vz-skills:<name>` (`status` becomes `vz-status`). Project scope uses `${CLAUDE_PROJECT_DIR}` paths and is committable. Verified against an isolated config directory and a temporary project (`tests/cli.test.js`).
- npm package `vz-skills` with a CLI: `npx vz-skills install|update|uninstall|try|doctor|path|validate`. The installer keeps a managed copy under `~/.vz-skills/marketplace`, registers it as a Claude Code marketplace, and installs the plugin at the chosen scope. The package ships only the plugin and the CLI. Verified end to end against an isolated `CLAUDE_CONFIG_DIR` (`tests/cli.test.js`). Not yet published to the registry.

### Changed
- Repository split: the specification kit and all process/tracker files moved out of the repository (DEC-013); `docs/decisions.md` keeps the decision log. Added a GitHub Actions workflow.

### Known limitations
- `claude plugin eval` behaviour on CLI 2.1.259 is below the documented minimum; see `docs/testing-and-evaluation.md` for what was observed.
- Injection detection and command guarding are heuristic and advisory.
