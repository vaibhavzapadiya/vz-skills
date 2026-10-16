# Architecture

```
VZ-skills/                         repository = local marketplace root
├── .claude-plugin/marketplace.json  marketplace "vz-skills-marketplace" -> ./plugins/vz-skills
├── bin/vz-skills.js                 npm CLI: install/update/uninstall/try/doctor (DEC-014)
├── package.json                     publishable as `vz-skills`; `files` ships bin + plugin + manifest only
├── plugins/vz-skills/               the installable plugin (everything a user receives)
│   ├── .claude-plugin/plugin.json   manifest (name, version, description, author, keywords)
│   ├── skills/<group>/<name>/SKILL.md   24 skills in entry/, lifecycle/, specialists/, productivity/ (see docs/skills-catalog.md);
│   │                                every group folder is listed in plugin.json "skills" or its skills would not load (DEC-016)
│   ├── agents/*.md                  3 read-only subagents
│   ├── hooks/hooks.json             3 hooks (PreToolUse x2, SessionStart)
│   ├── policy/core-policy.md        shared operating rules injected at session start
│   ├── references/*.md              risk tiers, review and security checklists, report template
│   ├── scripts/                     dependency-free Node
│   │   ├── vz-discover.js           CLI: repository discovery
│   │   ├── vz-config.js             CLI: config resolve/validate/init/explain
│   │   ├── vz-validate.js           CLI: structural validation of this plugin
│   │   ├── hooks/*.js               command-guard, write-guard, session-context
│   │   └── lib/                     discover, config, frontmatter, fsutil, hookio
│   └── evals/                       `claude plugin eval` cases (results/ ignored)
├── fixtures/                        13 repositories for discovery tests
├── tests/*.test.js                  node:test suites (structure, config, discovery, hooks, platform)
├── scripts/                         workspace tooling (catalog generator, release packager)
├── docs/                            user and maintainer documentation, decisions, examples
└── .github/workflows/ci.yml         CI: npm test, catalog check, structural validation
```

## Layers

| Layer | Implementation | Validated by |
|---|---|---|
| Platform/package | `plugin.json`, `marketplace.json`, standard layout | `claude plugin validate --strict --json`, `--plugin-dir` load, `plugin details` |
| Shared policy | `policy/core-policy.md`, injected by the SessionStart hook | hook tests; eval cases |
| Configuration | `lib/config.js`: schema, presets, precedence, floors; `vz-config.js` | `tests/config.test.js` |
| Repository intelligence | `lib/discover.js`: detectors, labels, injection scan, allowlisted baseline, cache | `tests/discovery.test.js` fixture matrix |
| Skills | `skills/*/SKILL.md`, grouped: user-run, lifecycle, specialists; `references/` for progressive disclosure | `vz-validate.js`, structure tests, catalog check, evals |
| Commands | user-run skills (`setup`, `status`) with `disable-model-invocation: true` (DEC-006) | same |
| Hooks | `hooks/hooks.json` + `scripts/hooks/*.js` + `lib/hookio.js` | `tests/hooks.test.js` |
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
3. Throughout, every Bash/Write call passes the guards; risky operations ask; catastrophic ones are denied; the user and Claude Code's permissions decide the rest.

## Extending

- Add a skill: `skills/<kebab-name>/SKILL.md` with `description`; run `npm test` (structure checks and catalog freshness) and `claude plugin validate --strict`.
- Add a config key: extend `SCHEMA` and, if it should have a floor, `floor`; add a row to `docs/configuration.md`; run `node scripts/gen-config-schema.js`; the config test asserts presets are schema-valid and the docs test asserts every key is documented.
- Add a hook: declare it in `hooks.json`, implement with `lib/hookio.js`, add fail-open and decision tests.
