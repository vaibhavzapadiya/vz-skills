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

Releases are published by `.github/workflows/release.yml` when a version tag is pushed. Only the maintainer can push `v*` tags (a tag ruleset enforces it).

1. Update `version` in `package.json` and `plugins/vz-skills/.claude-plugin/plugin.json` (they must match), and move the `CHANGELOG.md` `[Unreleased]` entries under `## [X.Y.Z] - <date>`. Run `npm run sync` in `site/` so the website shows the new version.
2. Run `npm test`, `claude plugin validate ./plugins/vz-skills --strict`, and `npm pack --dry-run` (the file list must hold only the plugin and the CLI). Re-read `docs/testing-and-evaluation.md` and update it with this release's observed results.
3. Commit and push to `main`; wait for CI.
4. Tag and push: `git tag -a vX.Y.Z -m "vz-skills X.Y.Z" && git push origin vX.Y.Z`.
5. When the workflow finishes, approve the staged version from a terminal logged in to npm with the stage id shown in the run summary: `npm stage approve <stage-id>` (prompts for 2FA; `npm stage list vz-skills` also shows the id). Until then it is not public. `npm stage view <stage-id>` and `npm stage download <stage-id>` let you inspect it first; `npm stage reject <stage-id>` discards it.

The workflow then checks that the tag matches both versions, that the tagged commit is on `main`, and that `CHANGELOG.md` has the section; runs the tests and every validator; stages the package on npm with provenance through npm Trusted Publishing (no npm token is stored; the trust relationship allows only staging, as npm recommends, so the workflow alone can never make a version public); and creates the GitHub release with that CHANGELOG section as its notes. Re-running it for a version already published skips the staging. The website deploys separately after CI passes on `main` (`.github/workflows/deploy-site.yml`).

`npm run package` still builds `dist/vz-skills-<version>.zip` for distributing the plugin without npm.

## Reporting issues

Open an issue at <https://github.com/vaibhavzapadiya/vz-skills/issues>. Include: Claude Code version (`claude --version`), OS, the skill or hook involved, the command or prompt, observed vs expected, and `node plugins/vz-skills/scripts/vz-config.js --explain --project .` output with any secrets redacted.
