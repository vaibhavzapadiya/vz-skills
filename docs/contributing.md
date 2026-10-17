# Contributing and maintenance

## Local development

```bash
git clone https://github.com/vaibhavzapadiya/vz-skills.git && cd vz-skills
npm test                                   # node scripts/run-tests.js: 107 tests, no installs, no network
                                           # (CLI and platform tests also use `claude` when it is on PATH)
claude plugin validate ./plugins/vz-skills --strict
claude --plugin-dir ./plugins/vz-skills    # try it in a session
```

Edit skills live: most SKILL.md edits apply without restarting (`/reload-skills`). Hook or manifest changes need `/reload-plugins` or a new session.

## Submitting changes

`main` is protected: nobody pushes to it directly except the maintainer. Every other change goes through a pull request:

1. Fork the repository on GitHub, clone your fork, and create a branch for your change:

   ```bash
   git clone https://github.com/<your-user>/vz-skills.git && cd vz-skills
   git checkout -b fix/short-description
   ```

2. Make the change with its test, then run `npm test` and `claude plugin validate ./plugins/vz-skills --strict`.
3. Push the branch to your fork and open a pull request against `main` in [vaibhavzapadiya/vz-skills](https://github.com/vaibhavzapadiya/vz-skills).

A pull request can merge when all four CI jobs pass (Ubuntu and Windows, Node 18 and 22) and the maintainer has approved it. Pushing new commits to the branch clears an earlier approval. Force-pushing to `main` and deleting it are blocked for everyone.

## Rules of the road

- **Verify platform claims against the current docs** at https://code.claude.com/docs (plugins, skills, hooks, sub-agents, plugin-evals pages). Record the page and access date in the decision log when you rely on a new platform detail.
- **Keep SKILL.md under ~200 lines**; put detail in `references/` and link it with `${CLAUDE_PLUGIN_ROOT}/references/...`.
- **No new runtime dependencies** without a decision entry in `docs/decisions.md`.
- **Every behaviour change in scripts needs a test**; every bug fix needs a regression test (see `tests/` and the `SEC-*` findings in `docs/security.md`).
- **Docs are generated where they can be**: run `node scripts/gen-catalog.js` after changing skill or agent frontmatter; run `node scripts/gen-config-schema.js` after changing `SCHEMA` in `lib/config.js`; `npm test` fails if the catalog or the config JSON Schema is stale and if a config key is undocumented.
- **Status words are exact**: IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED in reports and trackers.

## Adding a skill

1. `mkdir plugins/vz-skills/skills/<group>/<kebab-name>` (groups: `entry`, `lifecycle`, `specialists`, `productivity`) and write `SKILL.md` with frontmatter (`name` equal to the directory, a specific `description` that starts with the key use case; `disable-model-invocation: true` for user-only commands). A new group folder must also be added to the `skills` array in `.claude-plugin/plugin.json`; otherwise its skills load nowhere, and `vz-validate.js` and the structure tests will say so.
2. Body: purpose, inputs, workflow with decision points, output shape, safety, failure behaviour, validation scenarios.
3. `node plugins/vz-skills/scripts/vz-validate.js plugins/vz-skills && claude plugin validate ./plugins/vz-skills --strict`.
4. `node scripts/gen-catalog.js`, and add a changelog entry.
5. Add an eval case under `plugins/vz-skills/evals/` if the behaviour can be judged from a read-only run.

## Releasing

1. Update `plugins/vz-skills/.claude-plugin/plugin.json` `version` and `CHANGELOG.md`.
2. `npm test`, `claude plugin validate ./plugins/vz-skills --strict`, `node scripts/gen-catalog.js --check`.
3. `npm run package` builds `dist/vz-skills-<version>.zip` and verifies its integrity (listing, byte counts, required files).
4. Re-read `docs/testing-and-evaluation.md` and update it with the observed results of this release's checks.
5. Tag with `claude plugin tag ./plugins/vz-skills` if you publish through a git marketplace (it creates `vz-skills--v<version>`); push only with the owner's authorization.
6. Publish to npm (owner only): `npm pack` (runs `prepack`: catalog check and structural validation), inspect the tarball list (plugin + CLI only, no tests/fixtures/docs), test it with `npx --yes ./vz-skills-<version>.tgz doctor`, and `npm publish`. The npm version must equal `plugin.json` `version` (`tests/cli.test.js` checks this).

## Reporting issues

Open an issue at <https://github.com/vaibhavzapadiya/vz-skills/issues>. Include: Claude Code version (`claude --version`), OS, the skill or hook involved, the command or prompt, observed vs expected, and `node plugins/vz-skills/scripts/vz-config.js --explain --project .` output with any secrets redacted.
