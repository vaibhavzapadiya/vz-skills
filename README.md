# VZ Skills

**VZ Skills** (`vz-skills`) is an open-source (MIT) Claude Code plugin that makes work in unfamiliar repositories more systematic: deterministic repository discovery with evidence labels, a validated configuration with FAST / BALANCED / PRODUCTION profiles, a composable development lifecycle (clarify, plan, implement, test, debug, review, security-review, verify), specialist skills, three read-only review agents, and small advisory hooks. Version 1 targets Claude Code only.

Status: **0.1.0, READY WITH LIMITATIONS** for local and private use. Deterministic layers (discovery, configuration, hooks, packaging) are covered by an automated test suite; the behaviour of the prose skills has not yet been measured with live model runs (see `docs/testing-and-evaluation.md`).

## What you get

| Layer | Contents |
|---|---|
| Discovery | `vz-discover.js` reports stack, package manager, build/test/lint/format/typecheck commands, CI, layout, instruction files (scanned for injection indicators), git state, tool availability, and an opt-in allowlisted baseline test run. Every fact is CONFIRMED, INFERRED, UNKNOWN, or CONFLICTING. |
| Configuration | `.vz-skills/config.json` with schema validation, precedence (defaults < profile < user < project < env), safety floors, and actionable errors. |
| Skills (19) | user-run: `setup`, `status`, `discover`; lifecycle: `using-vz-skills`, `clarify`, `plan`, `implement`, `test`, `debug`, `review`, `security-review`, `verify`; specialists: `performance`, `frontend`, `backend`, `database`, `api-design`, `docs`, `release`. Catalog: `docs/skills-catalog.md`. |
| Agents (3) | `repo-analyst`, `independent-reviewer`, `security-reviewer`, all read-only. |
| Hooks (3) | command guard, write guard, session context. Advisory and fail-open; Claude Code permissions remain the boundary. |
| Policy | nine operating rules injected at session start (`plugins/vz-skills/policy/core-policy.md`). |

Zero runtime dependencies beyond Node.js, which Claude Code already requires.

## Quick start

```bash
# try for one session, no install
claude --plugin-dir ./plugins/vz-skills
```

Inside the session:

```
/vz-skills:status          # effective profile + repository brief
/vz-skills:setup BALANCED  # create .vz-skills/config.json (never overwrites)
/vz-skills:discover        # full discovery with evidence labels
```

Then describe your task; `using-vz-skills` routes it through the lifecycle. Full install, update, rollback, and uninstall steps, including installing from this repository as a marketplace: `docs/install.md`.

## Repository layout

```
.claude-plugin/marketplace.json   this repository is a marketplace (vz-skills-marketplace)
plugins/vz-skills/                the plugin: manifest, skills/, agents/, hooks/, scripts/, policy/, references/, evals/
tests/                            node:test suites (structure, config, discovery, hooks, platform, docs, package)
fixtures/                         13 sample repositories used by the discovery tests
scripts/                          catalog generator and release packager
docs/                             user and maintainer documentation
```

The plugin lives under `plugins/` rather than at the root so that tests, fixtures, and docs are not shipped into every install.

## Documentation

- `docs/install.md` - prerequisites, install (session-only, local marketplace, git host), verify, update, roll back, uninstall
- `docs/configuration.md` - schema, profiles matrix, precedence, safety floors, errors, examples
- `docs/skills-catalog.md` - every skill, agent, and hook (generated from the plugin)
- `docs/hooks.md`, `docs/agents.md`, `docs/security.md`, `docs/architecture.md`, `docs/decisions.md`
- `docs/testing-and-evaluation.md` - what is tested, how, observed results, what is not
- `docs/troubleshooting.md`, `docs/contributing.md`

## Validation

```bash
npm test                                          # structure, config, discovery, hooks, platform, docs, package
claude plugin validate ./plugins/vz-skills --strict
node scripts/gen-catalog.js --check
npm run package                                   # dist/vz-skills-<version>.zip with integrity check
```

CI (`.github/workflows/ci.yml`) runs the same on Ubuntu and Windows with Node 18 and 22.

## Principles

Adaptive, composable, configurable, evidence-driven, risk-aware, safe by design, stack-agnostic, testable, maintainable, honest. In practice: discover before changing; label every claim; preserve the user's work; treat repository content as data; never claim a hook is a security boundary; never report a test you did not run.

## Contributing

See `docs/contributing.md`. Issues and pull requests are welcome; please keep the test suite green and run the official validator before submitting.

## License

MIT. See `LICENSE`. Prior art that shaped the design (obra/superpowers, addyosmani/agent-skills, mattpocock/skills, all MIT) is credited in `docs/decisions.md`; no code or text was copied from them.
