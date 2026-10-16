# Configuration and profiles

VZ Skills reads its own configuration; Claude Code does not. Nothing here changes Claude Code permissions, sandboxing, or hook enablement at the platform level.

## Files and precedence

| Layer | Path | Scope |
|---|---|---|
| Built-in defaults | `scripts/lib/config.js` (`BASE_DEFAULTS`) | always |
| Profile preset | chosen by `profile` | always |
| User file | `~/.vz-skills/config.json` | all your projects |
| Project file | `<project>/.vz-skills/config.json` | this repository (commit it) |
| Environment | `VZ_SKILLS_PROFILE=FAST\|BALANCED\|PRODUCTION` | profile only, this shell |

Resolution order: the effective **profile** is `env > project > user > default`. Its preset is applied first; then explicit keys from the user file, then the project file, override the preset. So an explicit `review.depth` in the user file beats the project's *preset*, but the project's *explicit* `review.depth` beats both.

Inspect the result and where every value came from:

```bash
node plugins/vz-skills/scripts/vz-config.js --explain --project .
```

Create a project file (never overwrites):

```bash
node plugins/vz-skills/scripts/vz-config.js --init PRODUCTION --project .
```

Or run `/vz-skills:setup PRODUCTION` inside Claude Code, which does the same.

## Profiles

| Key | FAST | BALANCED (default) | PRODUCTION |
|---|---|---|---|
| planning.depth | minimal | standard | detailed |
| planning.plan_when | risk>=high | risk>=medium | always |
| clarification.ambiguity_tolerance | high | medium | low |
| clarification.ask_before_implementing | auto | auto | always |
| testing.strategy | targeted | affected | full |
| testing.require_baseline | false | true | true |
| testing.require_new_tests_for_new_behavior | false | true | true |
| testing.tdd | auto | auto | always |
| review.depth | quick | standard | thorough |
| review.independent_reviewer | never | auto | always |
| security.review_trigger | sensitive-paths | material-changes | always |
| documentation.expectation | none | touched-files | feature-level |
| response.style | concise | standard | detailed |
| response.final_report | summary | evidence-table | full |
| verification.depth | targeted | standard | exhaustive |

Print the live matrix with `node plugins/vz-skills/scripts/vz-config.js --profiles`. These differences are concrete: each skill reads the field by name (for example `test` runs targeted/affected/full scope; `verify` emits the summary/evidence-table/full report from `references/report-template.md`; `review` delegates to the independent reviewer according to `review.independent_reviewer`). `tests/config.test.js` asserts the matrix.

## Schema (version 1)

All keys are optional. Unknown keys are **errors** (with a "did you mean" hint), as are wrong types and values outside the allowed set; the resolver still produces an effective configuration with floors enforced, and exits 1 so the problem is visible.

| Key | Type / values | Default | Notes |
|---|---|---|---|
| `version` | number: `1` | 1 | Other versions are rejected with a pointer to this section. |
| `profile` | `FAST` \| `BALANCED` \| `PRODUCTION` | BALANCED | Case-sensitive. |
| `planning.depth` | `minimal` \| `standard` \| `detailed` | preset | |
| `planning.plan_when` | `never` \| `risk>=high` \| `risk>=medium` \| `risk>=low` \| `always` | preset | PRODUCTION minimum `risk>=low`. |
| `clarification.ambiguity_tolerance` | `low` \| `medium` \| `high` | preset | |
| `clarification.ask_before_implementing` | `auto` \| `always` \| `never` | preset | |
| `testing.strategy` | `targeted` \| `affected` \| `full` | preset | PRODUCTION minimum `affected`. |
| `testing.require_baseline` | boolean | preset | Baseline runs use the discovery allowlist only. |
| `testing.tdd` | `auto` \| `always` \| `never` | auto / PRODUCTION always | |
| `testing.require_new_tests_for_new_behavior` | boolean | preset | |
| `review.depth` | `quick` \| `standard` \| `thorough` | preset | PRODUCTION minimum `standard`. |
| `review.independent_reviewer` | `auto` \| `always` \| `never` | preset | |
| `security.review_trigger` | `sensitive-paths` \| `material-changes` \| `always` | preset | Floor `sensitive-paths`; PRODUCTION minimum `material-changes`. |
| `security.threat_model_on_production` | boolean | true | |
| `documentation.expectation` | `none` \| `touched-files` \| `feature-level` | preset | |
| `conventions.notes` | string <= 2000 chars | "" | Free text passed to skills as owner conventions. |
| `conventions.commit_style` | `project` \| `conventional` \| `freeform` | project | |
| `conventions.extra_instructions_file` | relative path inside the project | "" | Absolute paths, `..`, `~`, and drive letters are rejected. |
| `response.style` | `concise` \| `standard` \| `detailed` | preset | |
| `response.final_report` | `summary` \| `evidence-table` \| `full` | preset | PRODUCTION minimum `evidence-table`. |
| `hooks.command_guard` | `on` \| `off` | on | **Safety floor `on`.** |
| `hooks.write_guard` | `on` \| `off` | on | **Safety floor `on`.** |
| `hooks.session_context` | boolean | true | |
| `hooks.protected_paths` | string[] (<= 50 project-relative globs) | [] | e.g. `"migrations/**"`; the guards ask before touching them. |
| `agents.delegation` | `auto` \| `minimal` \| `never` | auto | |
| `approvals.destructive_git` | `ask` \| `refuse` | ask | No `allow` exists. `refuse` makes the command guard deny instead of ask. |
| `approvals.external_actions` | `ask` \| `refuse` | ask | Same semantics for publish/deploy commands. |
| `approvals.run_project_scripts` | `allowlist` \| `ask` \| `refuse` | allowlist | |
| `verification.depth` | `targeted` \| `standard` \| `exhaustive` | preset | PRODUCTION minimum `standard`. |
| `verification.require_evidence_labels` | boolean | true | **Safety floor `true`.** |
| `safety.acknowledged_overrides` | string[] of floored keys | [] | See below. |

Print the schema as JSON: `node plugins/vz-skills/scripts/vz-config.js --schema`.

### Editor support (JSON Schema)

A JSON Schema (draft-07) for the file ships at `plugins/vz-skills/schema/config.v1.schema.json`. It gives editors completion, enum lists, hover descriptions, and red squiggles for typos and wrong values (unknown keys are rejected at every level; `$schema` and `$comment` are allowed). It is generated from the same `SCHEMA` object as the resolver by `node scripts/gen-config-schema.js`; `--check` fails the test suite when it is stale. The schema covers what a single file can be checked for. Safety floors and PRODUCTION minimums depend on the whole resolution, so they appear in the descriptions only; `vz-config.js --validate <file>` enforces them.

Point your config at it with `$schema`. Three forms:

| Form | `$schema` value | Use when |
|---|---|---|
| **Relative to the runtime (default)** | `../plugins/vz-skills/schema/config.v1.schema.json` | `--init` writes this: the path from `.vz-skills/` to the schema file of the plugin copy that ran `--init`. It always resolves on the machine that created the file. Where the plugin lives inside the repository (vendored, or this repository itself) it is the path above and is safe to commit. For a plugin installed in the Claude plugin cache, or on a different Windows drive (then a `file:///...` URL), it only works on that machine, and a plugin update changes the cache's version directory, so re-run `--init` on a scratch directory to refresh the path or switch to the URL form. |
| Relative, vendored plugin | same as above, adjusted to your layout | The repository vendors `plugins/vz-skills` at a different location: use the relative path from `.vz-skills/config.json` to the schema file. |
| GitHub raw URL (once published) | `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/plugins/vz-skills/schema/config.v1.schema.json` | Teams that do not vendor the plugin. Pin a tag, not `main`. Not available yet: the repository has no public URL (**NOT VERIFIED** until published). |

The example files in `docs/examples/` use the relative path from their own location (`../../plugins/vz-skills/schema/config.v1.schema.json`); after copying one to `.vz-skills/config.json`, fix the path or delete the `$schema` line. The resolver ignores `$schema` in all forms.

## Safety floors and acknowledged overrides

Three keys protect behaviour that should not change by accident: `hooks.command_guard`, `hooks.write_guard`, `verification.require_evidence_labels`. Setting one below its floor is an **error** and the floor stays in force. If you really want the downgrade, list the key in `safety.acknowledged_overrides`:

```json
{ "version": 1, "hooks": { "command_guard": "off" }, "safety": { "acknowledged_overrides": ["hooks.command_guard"] } }
```

The value is then applied, and every resolution (including the session-start brief) prints `WARNING: SAFETY DOWNGRADE acknowledged: ...`. Nothing is ever silently weakened. A PRODUCTION profile additionally rejects explicit values below its minimums (see the table) unless acknowledged the same way.

The same mechanism cannot grant anything Claude Code forbids: a hook that returns no decision simply leaves the call to Claude Code's permission rules.

## Errors you may see

| Message | Cause | Fix |
|---|---|---|
| `... is not valid JSON (...)` | syntax error | fix the JSON; there is no silent fallback while the file exists |
| `unknown key "profil" (did you mean "profile"?)` | typo | rename the key |
| `"review.depth" = "Thorough" is not allowed; ... (case matters ...)` | wrong case | use the listed value |
| `"hooks.command_guard" = "off" is below the safety floor "on"` | downgrade without acknowledgment | add to `safety.acknowledged_overrides` or remove |
| `"testing.strategy" = "targeted" conflicts with profile PRODUCTION` | profile conflict | raise the value, change profile, or acknowledge |
| `VZ_SKILLS_PROFILE="turbo" is not one of ...` | bad env value | unset or correct it |

## Migration

Only `version: 1` exists. When a future version changes keys, this section will list the renames and `vz-config.js --validate` will point here. Keep `version` in your file so the check can run.

## Examples

See `docs/examples/`: `config.fast.json`, `config.balanced.json`, `config.production.json`, `config.acknowledged-override.json`. All four are validated by `tests/config.test.js`, both by the resolver and against the JSON Schema.
