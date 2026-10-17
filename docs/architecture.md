# Architecture

```
VZ-skills/                         repository = local marketplace root
├── .claude-plugin/marketplace.json  marketplace "vz-skills-marketplace" -> ./plugins/vz-skills
├── bin/
│   ├── vz-skills.js                 npm CLI: install/update/uninstall/try/doctor/path/validate, strict flags (DEC-014)
│   └── lib/flat.js                  unprefixed (--flat) install and uninstall: checks first, backups, manifest (DEC-015)
├── package.json                     published as `vz-skills`; `files` ships bin + plugin + manifest only
├── plugins/vz-skills/               the installable plugin (everything a user receives)
│   ├── .claude-plugin/plugin.json   manifest (name, version, description, author, keywords)
│   ├── skills/<group>/<name>/SKILL.md   33 skills in entry/, lifecycle/, specialists/, productivity/ (see docs/skills-catalog.md);
│   │                                every group folder is listed in plugin.json "skills" or its skills would not load (DEC-016)
│   ├── agents/*.md                  3 read-only subagents
│   ├── hooks/hooks.json             5 hooks on 5 events (PreToolUse x2, SessionStart, PostToolUse + PostToolUseFailure, Stop)
│   ├── policy/core-policy.md        shared operating rules injected at session start
│   ├── references/*.md              risk tiers, review and security checklists, report template
│   ├── scripts/                     dependency-free Node
│   │   ├── vz-discover.js           CLI: repository discovery
│   │   ├── vz-config.js             CLI: config resolve/validate/init/explain
│   │   ├── vz-validate.js           CLI: structural validation of this plugin
│   │   ├── vz-ledger.js             CLI: show the activity ledger (per session, md or json)
│   │   ├── vz-dashboard.js          CLI: write the project dashboard (.vz-skills/dashboard.html)
│   │   ├── hooks/*.js               command-guard, write-guard, session-context, ledger, claim-check
│   │   └── lib/                     discover, config, frontmatter, fsutil, hookio, ledger, skills
│   ├── schema/config.v1.schema.json JSON Schema for .vz-skills/config.json (generated)
│   └── evals/                       `claude plugin eval` cases (results/ ignored)
├── fixtures/                        17 repositories for discovery tests
├── tests/                           node:test suites, 107 tests
│   ├── helpers.js                   shared paths and runners
│   ├── structure.test.js            manifests, frontmatter, skill groups, vz-validate
│   ├── config.test.js               schema, presets, precedence, floors, JSON Schema
│   ├── discovery.test.js            fixture matrix, baseline allowlist, redaction
│   ├── hooks.test.js                guard decisions, fail-open, session brief, latency
│   ├── guard-hardening.test.js      bypass attempts against the guards and the discovery brief
│   ├── cli.test.js                  npm CLI: flags, doctor, flat and plugin install cycles
│   ├── activity.test.js             activity ledger, claim check, vz-ledger, dashboard
│   ├── platform.test.js             the real `claude` CLI: validate, --plugin-dir load
│   ├── docs.test.js                 documentation agrees with the code
│   └── package.test.js              release archive integrity
├── scripts/
│   ├── run-tests.js                 `npm test`: passes every tests/*.test.js to node --test (Node 18 has no glob)
│   ├── gen-catalog.js               generates docs/skills-catalog.md (--check in tests)
│   ├── gen-config-schema.js         generates the config JSON Schema (--check in tests)
│   └── package-release.js           release packager with integrity check
├── docs/                            user and maintainer documentation, decisions, examples
├── site/                            documentation website (Vite, React, MDX); not part of the npm package
└── .github/workflows/ci.yml         CI: npm test, catalog check, structural validation
```

## Layers

| Layer | Implementation | Validated by |
|---|---|---|
| Platform/package | `plugin.json`, `marketplace.json`, standard layout | `claude plugin validate --strict --json`, `--plugin-dir` load, `plugin details` |
| Shared policy | `policy/core-policy.md`, injected by the SessionStart hook | hook tests; eval cases |
| Configuration | `lib/config.js`: schema, presets, precedence, floors; `vz-config.js` | `tests/config.test.js` |
| Repository intelligence | `lib/discover.js`: detectors, labels, injection scan, allowlisted baseline, cache | `tests/discovery.test.js` fixture matrix |
| Skills | `skills/<group>/<name>/SKILL.md`, grouped: entry, lifecycle, specialists, productivity; `references/` for progressive disclosure | `vz-validate.js`, structure tests, catalog check, evals |
| Commands | user-run skills (`setup`, `status`) with `disable-model-invocation: true` (DEC-006) | same |
| Hooks | `hooks/hooks.json` + `scripts/hooks/*.js` + `lib/hookio.js` | `tests/hooks.test.js`, `tests/guard-hardening.test.js` |
| Activity record | `lib/ledger.js` (outside the repository), `hooks/ledger.js`, `hooks/claim-check.js`, `vz-ledger.js`, `vz-dashboard.js` | `tests/activity.test.js` |
| Agents | `agents/*.md`, read-only tools | structure tests, official validator |
| Validation/evaluation | `tests/`, `fixtures/`, `evals/`, `vz-validate.js` | `npm test`; `claude plugin eval` |
| Docs/distribution | `docs/`, `README.md`, `scripts/package-release.js` | catalog freshness check; packaging integrity check |

## Key design choices

- **Deterministic core, prose shell.** Everything that can be code is code (discovery, config, guards) and is unit-tested. Skills are short prose that reads the resolved config and the discovery report rather than reasoning from scratch.
- **Evidence labels everywhere.** Discovery facts carry CONFIRMED / INFERRED / UNKNOWN / CONFLICTING; work status carries IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED. The same words appear in the policy, the skills, the report template, and the eval graders.
- **Profiles change fields, not adjectives.** Each profile preset sets concrete keys that skills branch on; tests assert the differences.
- **Safety floors with loud overrides.** You can lower a guard, but never silently.
- **Advisory hooks.** Native permissions enforce; hooks reduce accidents.
- **No runtime dependencies.** Node only (which Claude Code already requires); no network; no install step.

## Data flow for a typical task

1. Session starts -> `session-context.js` resolves config and runs a shallow discovery -> policy + profile + brief are in context.
2. User asks for a change -> `using-vz-skills` routes -> `discover` (full, via `vz-discover.js`) -> `clarify` -> `plan` -> `implement` slices -> `test` (strategy from profile; baseline via allowlisted runner) -> `review` (optionally `independent-reviewer`) -> `security-review` (trigger from profile) -> `verify` (report format from profile).
3. Throughout, every Bash/Write call passes the guards; risky operations ask; catastrophic ones are denied; the user and Claude Code's permissions decide the rest. After each edit or command, `ledger.js` appends a line to the activity ledger.
4. When Claude is about to stop, `claim-check.js` compares any success claim in its final message with the ledger and sends it back once if no check ran after the last code edit.

## Extending

- Add a skill: `skills/<group>/<name>/SKILL.md` (groups: `entry`, `lifecycle`, `specialists`, `productivity`; a new group must be listed in `plugin.json` `skills`) with `name` and `description`; run `npm test` (structure checks and catalog freshness) and `claude plugin validate --strict`.
- Add a config key: extend `SCHEMA` and, if it should have a floor, `floor`; add a row to `docs/configuration.md`; run `node scripts/gen-config-schema.js`; the config test asserts presets are schema-valid and the docs test asserts every key is documented.
- Add a hook: declare it in `hooks.json`, implement with `lib/hookio.js`, add fail-open and decision tests.
