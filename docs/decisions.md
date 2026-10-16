# VZ Skills - Decision Log

Architecture decisions for the plugin, newest first. Do not silently change an accepted decision; supersede it with a new entry and rationale.

Prior art studied before the design (all MIT, accessed 2026-10-16; ideas only, no code or text copied): obra/superpowers, addyosmani/agent-skills, mattpocock/skills. Platform conventions were verified against the official Claude Code documentation pages for plugins (manifest reference, components, CLI reference, marketplace reference, install), skills, commands, hooks, sub-agents, and plugin evals, accessed 2026-10-16.

### DEC-015 - Unprefixed commands via a flat install, not via the plugin

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** The owner wants `/plan`, not `/vz-skills:plan`. Claude Code namespaces every plugin skill and provides no opt-out (skills reference, accessed 2026-10-16). Personal and project skills are not namespaced.
- **Decision:** Keep the plugin as the primary artifact and add `npx vz-skills install --flat`, which installs skills/agents/runtime/hooks into `$CLAUDE_CONFIG_DIR` (user) or `.claude/` (project/local) with references rewritten (`bin/lib/flat.js`). `status` is renamed `vz-status` to avoid hiding the built-in `/status`; `review` is allowed to replace the built-in `/review` because it is a review command. Managed files carry markers; settings are backed up; uninstall removes only what was installed.
- **Alternatives considered:** renaming the plugin to a one-letter name (still a prefix); asking users to copy skills by hand (loses hooks, scripts, and updates); shipping only flat (loses the plugin's single-unit install, versioning, and `plugin details` cost reporting).
- **Consequences/trade-offs:** Two layouts to keep in sync; the flat layout depends on `${CLAUDE_PROJECT_DIR}` substitution in skill bodies and settings hooks (documented platform behaviour). Hooks in the user scope use absolute paths and must be reinstalled if the config directory moves.

### DEC-014 - npm distribution through a managed local marketplace

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** Users should install with one command. Claude Code (docs accessed 2026-10-16) cannot add a marketplace *from* npm ("NPM marketplace sources not yet implemented"), although a marketplace entry may point at an npm package. Any route still needs `claude plugin marketplace add` plus `claude plugin install`. `npx` caches are temporary, so a marketplace must not point into them.
- **Decision:** Publish the repository's root package to npm as `vz-skills` with a `bin` CLI. `npx vz-skills install` copies the bundled plugin to `~/.vz-skills/marketplace` (a directory marketplace, read in place), registers it, and installs the plugin at the requested scope. `update` refreshes the copy; `uninstall --purge` removes everything the installer created. `try` wraps `claude --plugin-dir`. The npm `files` whitelist ships only `bin/`, `plugins/vz-skills/`, `.claude-plugin/`, README, LICENSE, CHANGELOG.
- **Alternatives considered:** marketplace entry with an `npm` plugin source (still needs a hosted marketplace to add first); `command` plugin source running `npx vz-skills path` (same prerequisite; also prompts the user to accept a command); global `npm install -g` (unnecessary, `npx` suffices).
- **Evidence/source:** marketplace reference (plugin and marketplace source tables), install reference; `tests/cli.test.js` runs the real cycle against an isolated `CLAUDE_CONFIG_DIR`.
- **Consequences/trade-offs:** Two install channels (npm copy vs clone) must not both register `vz-skills-marketplace`; the CLI detects a registration pointing elsewhere and says how to switch. Publishing requires the owner's npm credentials and is a separate, authorized step.

### DEC-013 - Plugin repository holds only the plugin; the build kit lives beside it

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** The repository was built from a specification kit (prompts, spec, trackers, audit). The owner asked for a clean open-source repository.
- **Decision:** This repository keeps the plugin, its tests and fixtures, user documentation, this decision log, and release tooling. The kit and all process files moved to a sibling folder (`VZ-skills-kit`) outside the repository. DEC-004 is superseded for the repository; the trackers remain the source of truth in the kit folder.
- **Consequences/trade-offs:** Public readers see only what they need; progress and acceptance tracking continue privately. Docs here no longer reference tracker files.

## Decision template

### DEC-XXX - Short title

- **Status:** PROPOSED / ACCEPTED / REJECTED / SUPERSEDED
- **Date:**
- **Context:**
- **Decision:**
- **Alternatives considered:**
- **Evidence/source:**
- **Consequences/trade-offs:**
- **Follow-up/test required:**

## Decisions

### DEC-012 - Hooks fail open; native permissions remain the boundary

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** A hook that crashes or times out must not block every shell command, and the docs say a timed-out PreToolUse hook does not block by default (S-05). `onFailure: "block"` needs CLI >= 2.1.295, newer than the local 2.1.259.
- **Decision:** All VZ hooks exit 0 with no decision on malformed input or internal error, log a one-line reason to stderr, and never claim enforcement. Catastrophic shell patterns return `deny`; risky ones return `ask`; everything else is silent.
- **Alternatives considered:** exit 2 on error (fail closed) - rejected as a usability hazard; no hooks at all - rejected because cheap deterministic checks catch common accidents.
- **Evidence/source:** S-05, S-07; hook tests in `tests/hooks.test.js`.
- **Consequences/trade-offs:** The guard is advisory. Documentation states this explicitly (docs/hooks.md, docs/security.md).
- **Follow-up/test required:** Tests for normal, malformed, catastrophic, risky, idempotent cases.

### DEC-011 - Node.js is the only script runtime

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** Hooks and discovery need a cross-platform runtime. Claude Code itself is distributed via npm and runs on Node.
- **Decision:** All executable pieces (hooks, discovery, config resolver, validators, tests) are dependency-free Node.js (>= 18, tested on 22.21.1) using `node:test`. No npm dependencies.
- **Alternatives considered:** Bash scripts (not portable to Windows PowerShell-only setups); Python (not guaranteed present).
- **Evidence/source:** Local tooling inspection 2026-10-16; S-05 Windows notes.
- **Consequences/trade-offs:** Hook commands use exec form `"command": "node", "args": [...]`, which needs no shell quoting and works on both shells.
- **Follow-up/test required:** `npm test` runs the whole suite with zero installs.

### DEC-010 - Project license: MIT

- **Status:** ACCEPTED (owner chose MIT on 2026-10-16)
- **Date:** 2026-10-16
- **Context:** `LICENSE-NOTICE.md` from the kit defers the license choice to the project owner. Reference projects are MIT but nothing was copied.
- **Decision:** MIT. `LICENSE` at the repository root and a copy in `plugins/vz-skills/`; `"license": "MIT"` in `plugin.json` and `package.json`.
- **Alternatives considered:** Defaulting to MIT - rejected because it is the owner's call.
- **Follow-up/test required:** none; `tests/docs.test.js` checks the manifest field and LICENSE file exist.

### DEC-009 - Configuration lives in `.vz-skills/config.json`, not in `.claude/`

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** The master prompt suggests `.vz-skills/` unless platform conventions require otherwise. Claude Code reads `.claude/settings.json` for its own settings and would ignore (and `claude plugin validate` would not understand) foreign keys there.
- **Decision:** Project config at `<project>/.vz-skills/config.json`; optional user config at `~/.vz-skills/config.json`; `VZ_SKILLS_PROFILE` environment variable overrides `profile` only. Precedence: defaults < user < project < env. Safety-sensitive keys have floors that cannot be lowered without an explicit `safety.acknowledged_overrides` entry, and every applied override is printed as a warning.
- **Alternatives considered:** plugin `userConfig` (only prompts for scalar values and is user-scoped, not per-repo); `.claude/settings.json` keys (not a supported extension point).
- **Evidence/source:** S-02 (userConfig semantics), S-10 (settings scopes).
- **Consequences/trade-offs:** Config is read by VZ scripts only; Claude Code itself does not read it. Skills instruct Claude to run `vz-config.js` (or rely on the SessionStart summary) rather than parse JSON by hand.
- **Follow-up/test required:** `tests/config.test.js`.

### DEC-008 - Three subagents, all read-only

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** Plugin agents ignore `permissionMode`/`hooks` but honor `tools` (S-06, S-07). Fresh-context review is the one benefit of delegation that has a clear rationale.
- **Decision:** Ship `repo-analyst`, `independent-reviewer`, `security-reviewer`, each restricted with `tools:` to read-only tools (Read, Glob, Grep, Bash for read-only git/discovery commands is **not** granted; discovery output is passed in by the caller). Reject performance, docs, test-strategist agents for v1.
- **Alternatives considered:** No agents (loses independent review); many personas (orchestration cost without evidence).
- **Follow-up/test required:** Structural validation of agent frontmatter against the supported-field list; scenario notes in docs/agents.md.

### DEC-007 - Three hooks only

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** Hooks fire on every event for every project once the plugin is enabled (S-07). Each one must earn its cost.
- **Decision:** `PreToolUse` on `Bash|PowerShell` (command guard), `PreToolUse` on `Write|Edit|MultiEdit` (write guard: sensitive paths + obvious secrets), `SessionStart` (profile + discovery brief as `additionalContext`). No Stop, UserPromptSubmit, PostToolUse, or network hooks.
- **Alternatives considered:** Stop hook that re-runs verification (loop risk, native cap of 8); formatter hooks (project-specific).
- **Follow-up/test required:** `tests/hooks.test.js`; latency measured in tests (< 2 s budget asserted, typical < 200 ms).

### DEC-006 - Commands are user-invocable skills

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** Official docs: "Custom commands have been merged into skills"; new plugins should prefer `skills/` (S-03, S-04, S-02 layout table).
- **Decision:** No `commands/` directory. User-facing entry points (`setup`, `status`, `discover`, `plan`, `review`, `verify`, ...) are skills; `setup` and `status` set `disable-model-invocation: true` so only the user runs them. Namespace is `/vz-skills:<skill>` as the platform assigns it.
- **Alternatives considered:** Legacy `commands/*.md` duplicates (rejected: duplication, documented as legacy).

### DEC-005 - Repository layout: marketplace root + `plugins/vz-skills`

- **Status:** ACCEPTED
- **Date:** 2026-10-16
- **Context:** A local directory marketplace needs `.claude-plugin/marketplace.json` at its root with relative plugin sources (S-09). Keeping the plugin under `plugins/vz-skills` keeps specification, tests, fixtures, and docs out of the installed plugin.
- **Decision:** Repo root = marketplace root (`name: vz-skills-marketplace`). Plugin at `plugins/vz-skills/` with its own manifest. Tests at `tests/`, fixtures at `fixtures/`, docs at `docs/`, kit control files kept at `project/`, `spec/`, `quality/`, `tracking/`, `prompts/`, `templates/`, `research/`.
- **Alternatives considered:** Plugin at repo root (would ship tests/fixtures/docs into every install).

### DEC-004 - Tracker location stays at `project/` (kit layout), research at `docs/research/`

- **Status:** SUPERSEDED by DEC-013 (the kit folder now holds these; paths below are relative to that folder)
- **Date:** 2026-10-16
- **Context:** The kit's protocol text references `docs/project/*.md` while the kit itself (and the build instructions) ship and name `project/*.md`.
- **Decision:** `project/` remains the single source of truth; `docs/project/README.md` points there to satisfy the resume/audit prompts. Research outputs go to `docs/research/` as the master prompt requires.
- **Alternatives considered:** Moving the kit files (breaks the instructions the owner pasted).

### DEC-003 - Native platform permissions remain authoritative

- **Status:** ACCEPTED
- **Context:** Skills and hooks cannot be treated as complete security boundaries.
- **Decision:** Do not imply VZ configuration can override platform permissions or sandbox policy.
- **Alternatives considered:** Plugin-level approval framework that claims enforcement.
- **Consequences/trade-offs:** Safety messaging stays accurate; enforcement depends on supported native controls.
- **Follow-up/test required:** Audit docs and risky-action workflows. (Done in Phase 8; see docs/security.md.)

### DEC-002 - BALANCED is the default profile

- **Status:** ACCEPTED (was PROPOSED; accepted 2026-10-16 once profile fields became concrete, see docs/configuration.md)
- **Context:** Need useful defaults without mandatory configuration.
- **Decision:** BALANCED is the default; FAST and PRODUCTION change resolved fields (planning threshold, test scope, review depth, security trigger, report format, clarification tolerance).
- **Alternatives considered:** No profiles; user-configured settings only.
- **Consequences/trade-offs:** Profiles improve usability but must avoid hidden complexity.
- **Follow-up/test required:** `tests/config.test.js` asserts the resolved differences.

### DEC-001 - Claude Code is the only v1 runtime

- **Status:** ACCEPTED
- **Context:** Initial product scope.
- **Decision:** Build and validate for Claude Code only. Keep internal boundaries maintainable, but do not implement other runtimes.
- **Alternatives considered:** Multi-runtime from the start.
- **Consequences/trade-offs:** Faster validation and fewer compatibility branches; portability is not guaranteed.
- **Follow-up/test required:** Confirm all shipped structures and instructions match current Claude Code conventions. (Phase 1 validation.)
