# Changelog

All notable changes to VZ Skills are recorded here. The format follows Keep a Changelog; versions follow semver and match `plugins/vz-skills/.claude-plugin/plugin.json`.

## [Unreleased]

## [0.2.1] - 2026-10-17

The plugin and the CLI are unchanged from 0.2.0. This is the first release built by the release workflow.

### Changed
- Releases are built by GitHub Actions and staged on npm with provenance through npm Trusted Publishing (no stored npm token); a maintainer makes each version public with `npm stage approve` and 2FA. The npm page links every version to the exact commit and workflow run that built it.
- The website deploys automatically after CI passes on `main`.

## [0.2.0] - 2026-10-17

### Added
- `commit` skill: stages only the task's files by name (never `git add -A`), checks the staged diff for secrets and stray files, writes the message in the repository's commit style, never skips git hooks, and asks before committing straight to the default branch of a pull-request repository. `implement` and `pr` hand off to it.
- `adr` skill: architecture decision records in the repository's existing format and numbering; new, supersede or deprecate (never rewriting history), and list. `plan` proposes one for lasting decisions; `docs` defers to it.
- Command guard asks before `--no-verify` (and `git commit -n`), which skips the project's git hooks.
- `ledger` skill: shows what Claude edited and ran in this project, and which checks passed or failed, from the activity ledger (runs `scripts/vz-ledger.js`).
- `dashboard` skill: writes one self-contained HTML page, `.vz-skills/dashboard.html`, with the current task, settings, stack and commands, git state, architecture decisions, AI activity, instruction files and risks, and docs (runs `scripts/vz-dashboard.js`).
- `impact` skill: read-only impact analysis before changing shared code: callers with `file:line`, covering tests, public exposure, change history, and risk tier.
- `onboard` skill: a one-page onboarding guide from the repository's real state. Prints the guide; writes `docs/ONBOARDING.md` only when asked.
- `prove-test` skill: runs a new test without the change in a temporary git worktree. It must fail there and pass with the change. The working tree is not touched and the worktree is removed afterwards.
- `deps` skill: dependency upgrades and audits one package at a time: release notes first, upgrade through the package manager (never by editing the lockfile), run the affected checks, roll back on failure.
- `learn-conventions` skill: measures the repository's real conventions (naming, layout, errors, logging, tests, commits) with evidence counts, and saves them to `conventions.notes` only on request.
- Activity ledger hook (`PostToolUse` and `PostToolUseFailure` on `Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell`, `scripts/hooks/ledger.js`): appends one JSON line per file edit or shell command to `$VZ_SKILLS_HOME/ledger/<project>-<hash>.jsonl` (default `~/.vz-skills/ledger/`), outside the repository. Commands are truncated to 300 characters and secret-looking values redacted; tests, lint, typecheck, and build commands are marked as checks with pass or fail. The file rotates at 5 MB.
- Claim check hook (`Stop`, `scripts/hooks/claim-check.js`): when Claude's final message claims success after a code change and the ledger shows no test, lint, typecheck, or build after the last code edit (or the last check failed while the message says it passed), it sends Claude back once to run the check or say NOT VERIFIED. Never twice in a row; quiet for docs-only edits and for messages that already say NOT VERIFIED or BLOCKED.
- Config keys `hooks.ledger` and `hooks.claim_check` (both default `true`; the claim check needs the ledger).
- Scripts `scripts/vz-ledger.js` (`--project`, `--session`, `--last-session`, `--limit`, `--format md|json`, `--path`) and `scripts/vz-dashboard.js` (`--project`, `--out <file>|-`, `--no-git`), with `scripts/lib/ledger.js` shared by the hooks and both scripts.
- `tests/activity.test.js` (5 tests): ledger records and redaction, claim check decisions, `vz-ledger` output, dashboard escaping, and one ledger per project after a `cd` into a subfolder. `npm test` now runs 107 tests.

### Changed
- The router (`using-vz-skills`) routes to the new skills. `test` runs `prove-test` on new tests for bug fixes and high-risk changes. `plan` runs `impact` before changing shared or public code. `setup` suggests `learn-conventions` for `conventions.notes`.
- 5 hooks now (command guard, write guard, session brief, activity ledger, claim check). The flat install merges hooks for every event in `hooks.json`, not only `PreToolUse` and `SessionStart`. The platform test checks the hook list from `hooks.json`, and the site's content check counts distinct hook scripts.
- Always-on context cost measured with `claude plugin details` on Claude Code 2.1.233: about 2,826 tokens for 33 skills.
- `plan` groups large work into milestones that can each merge as one pull request.
- Review checklist: test quality (behaviour, no sleeps or real network, fails when the change is reverted), new configuration with safe defaults, and schema changes that survive a rolling deploy.

## [0.1.2] - 2026-10-17

### Changed
- README shortened and simplified (226 to 139 lines): quick start, how it works, install options, profiles, skills, safety, and status, with reference detail moved to the linked docs. Links the website at https://vz-skills.vaibhavzapadiya.workers.dev.
- The website is deployed to Cloudflare Workers (`site/wrangler.jsonc`, `npm run deploy` in `site/`).

## [0.1.1] - 2026-10-17

### Security
- Command guard reads commands by structure instead of matching the whole line. It splits the line into simple commands (outside quotes, at `;`, `&&`, `||`, `|`, `&`, newlines, parentheses, braces, backticks, and `$( )`), skips wrappers such as `sudo`, `env`, `nohup`, and environment assignments, and judges `rm`/`Remove-Item` (and `ri`, `del`, `erase`, `rd`, `rmdir`), `find -delete`, `format`, and `git` from their real flags and arguments. Flag order, quoting, and subshells no longer change the outcome. Quoted text is not a command, except the argument of `bash -c`/`sh -c`, `pwsh -Command`, `cmd /c`, `eval`, and `iex`, which is read as a command line of its own. PowerShell tool calls are read with PowerShell's backtick escapes and line continuations.
- Command guard denies recursive deletes of `/`, the home directory (`~`, `$HOME`, `${HOME}`), the working directory (`.`, `*`), parent directories (`..`, `../..`), drive roots (`C:\`, `C:/`, `/c`, `/mnt/c`), and system directories (`/etc`, `/usr`, `/home`, `C:\Windows`, ...); `--no-preserve-root`; `find <root> -delete` with no filter; and force-push or deletion of `main`/`master` in any argument order, including `+main`, `:main`, and `HEAD:main` refspecs. Force-pushing other branches asks.
- Command guard asks before external actions it used to let through: any `git push`, `git tag <name>` (creating or deleting; listing stays quiet), `gh pr create|merge|close|comment|edit|review`, `gh issue create|close|comment|edit`, `gh release create|delete|edit|upload`, `gh repo delete|create|edit`, and `npm|pnpm|yarn version <v>` (unless `--no-git-tag-version`). `approvals.external_actions: refuse` turns these into denies.
- Command guard asks for more destructive operations: `git reset --merge|--keep`, `git checkout -f`, `git restore` of paths (not `--staged`), `git branch --delete --force`, `git push --mirror|--delete`; `ALTER TABLE ... DROP`, `TRUNCATE` without `TABLE`, and `DELETE FROM` without `WHERE`; `kubectl replace|scale|rollout|drain|patch`.
- `git -C <dir>` and `git -c key=value` no longer hide the subcommand from the guard.
- Commands longer than 32 KB, and hook input over 2 MiB, get "ask" instead of failing open.
- Write guard resolves symlinks and junctions before judging a path (a link that leads outside the project asks), and compares paths without case on Windows and macOS.
- Write guard denies more home credential stores (`.docker`, `.config/gh`, `.azure`, `.config/gcloud`, `.git-credentials`) and `~/.claude.json`; asks for shell startup files (`.bashrc`, `.zshrc`, `.profile`, PowerShell profiles), anything under `~/.claude/`, project `.claude/agents|commands|skills|hooks|rules|output-styles`, and `.mcp.json`.
- Write guard secret detection: adds `glpat-`, `sk_live_`, `npm_` tokens, `ENCRYPTED PRIVATE KEY` blocks, JSON-style `"api_key": "..."`, and unquoted `SECRET=value` lines; `.env` detection covers `prod.env`-style names and `.envrc`. A `mock/` directory is no longer exempt from the content check (only `__mocks__/` is).
- A project's own `.vz-skills/config.json` can no longer switch off its guards: lowering a hard safety floor (`hooks.command_guard`, `hooks.write_guard`, `verification.require_evidence_labels`) is honoured only when `safety.acknowledged_overrides` lists the key in the user config (`~/.vz-skills/config.json`). A project-only acknowledgment is an error and the floor stays.
- `conventions.notes` and `conventions.extra_instructions_file` are treated as style guidance only and cannot authorize anything the core policy restricts.
- Repository-derived values in the discovery report stay one per line (embedded newlines are collapsed) and the session brief labels them as data. TOML parsing is safe against prototype pollution, and `.sln` names with unusual characters never reach a command.
- `hooks.protected_paths` globs are matched with a linear matcher, so a hostile glob cannot hang a hook.

### Fixed
- Command guard no longer reacts to a commit message (or any quoted text) that mentions a dangerous command.
- Reading `.env.example`, `.env.sample`, `.env.template`, or `.env.dist` no longer asks; `grep`, `rg`, `findstr`, `Select-String`, `sed`, and `awk` on secret files now ask.
- Write guard no longer flags kebab-case words that contain `sk-`: provider tokens must start at a word boundary.
- `kubectl delete|apply|...` with `--dry-run` no longer asks; `heroku` asks only for mutating subcommands.
- CLI: Windows paths with spaces work (arguments are quoted), and the Node `DEP0190` warning is gone.
- CLI: `uninstall` when the plugin is not installed prints `Plugin ... is not installed at scope <scope>` instead of failing; `uninstall --flat` with nothing installed prints "Nothing to uninstall".
- CLI: `doctor` recognises `Status: enabled` as well as `Status: loaded`.
- CLI: detecting a `vz-skills-marketplace` registered from another path strips the `Directory (...)` wrapper before comparing paths.
- Flat install checks everything first (skill and agent name collisions, a readable `settings.json`) and writes nothing if a check fails. A malformed `settings.json` gives an error naming the file. A same-named agent file you wrote is a collision, like skills.
- Flat uninstall refuses, changing nothing, when the existing flat install was made with a different `--scope` (project vs local), and parses settings before deleting anything.
- Discovery no longer crashes on a malformed `package.json` or `workspaces` field.
- `vz-config.js --init` accepts the profile in any case (`production` becomes `PRODUCTION`).

### Changed
- CLI flags are strict per subcommand: unknown flags and typos exit 2, `--scope=x` is accepted, and `-h`/`--help` on a subcommand prints help instead of running it. `install` accepts `--flat --force --scope`; `update` accepts `--flat --scope`; `uninstall` accepts `--flat --purge --scope` (`--purge` with `--flat` is an error).
- `update --flat` finds the scope of the existing flat install and no longer forces replacement; plain `update` passes `--scope` to `claude plugin update` (default `user`).
- `install --flat --force` backs up the skills and agents it replaces to `<config or .claude>/vz-skills-backups/<timestamp>/` first. Only the last three `settings.json` backups are kept.
- Core policy: undo your own edits by editing them back, never with `git checkout --`, `git restore`, `git stash`, or `git reset`; outside a git repository, list the files before editing and report integrity as NOT VERIFIED; any `git push`, creating tags, or creating pull requests needs the user's go-ahead; `approvals.run_project_scripts` (`allowlist` / `ask` / `refuse`) is defined there.
- `agents.delegation` is defined in `references/risk-tiers.md`: `auto`, `minimal` (only when the risk tier is high), `never`. `repo-analyst` is used by `plan` and `explain` (no longer by `discover`).
- Skills: `discover --baseline` maps to the script's `--run-baseline`; `implement` records a baseline before the first edit when `testing.require_baseline` is true or risk is high; `pr` handles uncommitted work, a detached HEAD, and an existing PR, and never prints secret values; `standup` takes multi-word windows and commit or tag ranges and separates other authors' commits; `checkpoint` resume re-runs a recorded command only if discovery CONFIRMED it, otherwise it asks.
- `npm test` runs `node scripts/run-tests.js`: 102 tests, including the new `tests/guard-hardening.test.js`.

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
- npm package `vz-skills` with a CLI: `npx vz-skills install|update|uninstall|try|doctor|path|validate`. The installer keeps a managed copy under `~/.vz-skills/marketplace`, registers it as a Claude Code marketplace, and installs the plugin at the chosen scope. The package ships only the plugin and the CLI. Verified end to end against an isolated `CLAUDE_CONFIG_DIR` (`tests/cli.test.js`). Published to npm as `vz-skills@0.1.0`.

### Changed
- Skills are grouped into `skills/entry`, `skills/lifecycle`, `skills/specialists`, `skills/productivity`, each listed in `plugin.json` `skills` (DEC-016). Names and invocation are unchanged. `scripts/lib/skills.js` mirrors the platform scan; the validator and tests flag any group folder missing from the manifest, a case the official validator does not report.
- Repository split: the specification kit and all process/tracker files moved out of the repository (DEC-013); `docs/decisions.md` keeps the decision log. Added a GitHub Actions workflow.

### Known limitations
- `claude plugin eval` behaviour on CLI 2.1.259 is below the documented minimum; see `docs/testing-and-evaluation.md` for what was observed.
- Injection detection and command guarding are heuristic and advisory.
