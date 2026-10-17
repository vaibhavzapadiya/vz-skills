# Install, update, roll back, uninstall

Every command below was taken from the official Claude Code plugin documentation (accessed 2026-10-16; the pages are listed in `docs/decisions.md` and `docs/testing-and-evaluation.md`) and the ones marked *verified* were executed on Claude Code **2.1.259** on Windows 11 during the build.

## Prerequisites

| Requirement | Why | Check |
|---|---|---|
| Claude Code >= 2.1.233 (2.1.259 or later recommended) | plugin `--plugin-dir`, `claude plugin validate --json` (>= 2.1.259), directory validation (>= 2.1.233) | `claude --version` |
| Node.js >= 18 | hooks and scripts are dependency-free Node (Claude Code itself runs on Node) | `node --version` |
| git (optional) | discovery reports branch and dirty files; everything else works without it | `git --version` |

No npm packages are installed by VZ Skills. Nothing is downloaded at runtime.

## Option A: npm, one command - *verified in an isolated config directory*

```bash
npx vz-skills install                # user scope (default)
npx vz-skills install --scope project
npx vz-skills install --scope local
```

What it does, in order: checks that `claude` is on PATH; copies the bundled plugin to `~/.vz-skills/marketplace/plugins/vz-skills` (and the marketplace manifest beside it); runs `claude plugin marketplace add ~/.vz-skills/marketplace` (or refreshes it if already registered); runs `claude plugin install vz-skills@vz-skills-marketplace --scope <scope>`. The copy exists because `npx` caches are temporary and a marketplace added from a directory is read in place.

Observed output on Claude Code 2.1.259 (run against an isolated `CLAUDE_CONFIG_DIR`, so the developer's own settings were untouched):

```text
Copied plugin 0.1.0 to ...\.vz-skills\marketplace\plugins\vz-skills
✔ Successfully added marketplace: vz-skills-marketplace (declared in user settings)
✔ Successfully installed plugin: vz-skills@vz-skills-marketplace (scope: user)
```

Other commands: `npx vz-skills try` (one session, nothing written), `npx vz-skills doctor`, `npx vz-skills@latest update`, `npx vz-skills uninstall [--purge]`, `npx vz-skills path`, `npx vz-skills validate`. `tests/cli.test.js` exercises the whole install/update/uninstall cycle in isolation whenever the `claude` CLI is available. The package is [`vz-skills` on npm](https://www.npmjs.com/package/vz-skills). To test an unreleased version from a clone, `npm pack` there and run `npx --yes ./vz-skills-<version>.tgz install`.

Flags are strict per subcommand:

| Subcommand | Accepts |
|---|---|
| `install` | `--flat`, `--force` (only with `--flat`), `--scope user\|project\|local` |
| `update` | `--flat`, `--scope ...` |
| `uninstall` | `--flat`, `--purge` (not with `--flat`), `--scope ...` |

An unknown or misspelled flag (`--scop project`, `--flaat`) exits with code 2 and changes nothing, so a typo cannot install into the wrong scope. `--scope x`, `-s x`, and `--scope=x` all work. `-h` or `--help` after a subcommand prints the help and does not run it. On Windows, arguments passed to `claude` are quoted, so a home directory with a space in it (`C:\Users\First Last`) works.

### Unprefixed commands (`--flat`) - *verified in an isolated config directory and a temporary project*

Claude Code namespaces plugin skills as `/<plugin>:<skill>` and offers no setting to disable that. Skills in the personal skills directory (`~/.claude/skills`, or `$CLAUDE_CONFIG_DIR/skills`) or a project's `.claude/skills` load as plain `/<name>`. `npx vz-skills install --flat` installs that way:

| Scope | Skills and agents | Runtime (scripts, policy, references) | Hooks |
|---|---|---|---|
| `user` (default) | `~/.claude/skills/<name>/`, `~/.claude/agents/` | `~/.claude/vz-skills/` | merged into `~/.claude/settings.json` with absolute paths |
| `project` | `.claude/skills/`, `.claude/agents/` | `.claude/vz-skills/` | merged into `.claude/settings.json` using `${CLAUDE_PROJECT_DIR}` (portable, commit it) |
| `local` | same as project | same as project | merged into `.claude/settings.local.json` (personal) |

Rewrites: `${CLAUDE_PLUGIN_ROOT}` becomes the runtime path; `/vz-skills:<name>` becomes `/<name>`; agent references lose the prefix (`@agent-vz-skills:repo-analyst` becomes `@agent-repo-analyst`); `status` is renamed `vz-status` because a skill named `status` would replace Claude Code's built-in `/status` (custom skills override bundled commands of the same name; `/review` is intentionally allowed to override). Each installed skill carries a `.vz-skills-managed` marker, and each installed agent contains the text "VZ Skills plugin". An existing skill without the marker, or an agent file of the same name without that text (one you wrote), is a collision. The install checks everything before it writes anything: skill and agent collisions, and that the target `settings.json` parses. If a check fails, nothing is changed, and the error names the colliding items or the malformed file. `--force` replaces colliding skills and agents, after copying them to `<base>/vz-skills-backups/<timestamp>/`, where `<base>` is your Claude config directory (user scope) or the project's `.claude/`. `settings.json` is backed up beside itself (`settings.json.vz-backup-<timestamp>`) before every write; only the last three backups are kept. `uninstall --flat` removes only the hook groups whose commands point into the runtime directory.

Do not combine a flat install and a plugin install in the same scope: you would get every skill twice in the listing.

## Option B: try it for one session from a clone (no install) - *verified*

From any project directory:

```bash
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills
```

The plugin loads as `vz-skills@inline`. Confirm inside the session with `/plugin` (Installed tab) or from a shell:

```bash
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills plugin list
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills plugin details vz-skills
```

Observed output on 2.1.259: `vz-skills@inline ... Status: ✔ loaded`, and `details` lists 24 skills, 3 agents, and 2 hook events. Claude Code 2.1.233 words the status as `✔ enabled`; other versions may word it differently.

## Option C: install from a clone as a local marketplace - *verified in an isolated config directory (same commands the npm CLI runs)*

The repository root is a marketplace (`.claude-plugin/marketplace.json`, name `vz-skills-marketplace`).

```bash
claude plugin marketplace add /path/to/VZ-skills
claude plugin install vz-skills@vz-skills-marketplace --scope user
```

Scopes: `--scope user` (every project on this machine, written to `~/.claude/settings.json`), `--scope project` (`.claude/settings.json`, committed; collaborators run the same install once), `--scope local` (`.claude/settings.local.json`). The install prints `Successfully installed plugin: vz-skills@vz-skills-marketplace (scope: ...)`. Restart Claude Code or run `/reload-plugins`.

Inside a session the equivalent is `/plugin marketplace add /path/to/VZ-skills` then `/plugin install vz-skills@vz-skills-marketplace`.

### Verify an install

```bash
claude plugin list
```

Expect `vz-skills@vz-skills-marketplace` with `Status: ✔ enabled` (Claude Code 2.1.233; 2.1.259 printed `✔ loaded`, and other versions may word it differently). `npx vz-skills doctor` accepts either word. In a session, type `/vz-skills:` and the skills should autocomplete; run `/vz-skills:status` for a read-only self-check.

## Option D: from GitHub - *verified in an isolated config directory on Claude Code 2.1.233*

The repository is published at <https://github.com/vaibhavzapadiya/vz-skills> and its root is the marketplace.

```bash
claude plugin marketplace add vaibhavzapadiya/vz-skills
claude plugin install vz-skills@vz-skills-marketplace --scope user
```

Inside a session the equivalent is `/plugin marketplace add vaibhavzapadiya/vz-skills` then `/plugin install vz-skills@vz-skills-marketplace`. Scopes are as in Option C. For other git hosts, pass the full clone URL to `marketplace add`.

## First use in a project

1. `/vz-skills:status` to see the effective profile (BALANCED by default) and a repository brief.
2. `/vz-skills:setup BALANCED` (or FAST / PRODUCTION) to create `.vz-skills/config.json`. Nothing else in the project is touched. See `docs/configuration.md`.
3. Start a task; the `using-vz-skills` skill routes it, or invoke skills directly (`/vz-skills:discover`, `/vz-skills:plan`, ...). The catalog is in `docs/skills-catalog.md`.

## Update

- npm: `npx vz-skills@latest update` (copies the new version into `~/.vz-skills/marketplace`, refreshes the marketplace, and runs `claude plugin update` at `--scope user`). If you installed with `--scope project` or `--scope local`, pass the same `--scope` here.
- npm, flat: `npx vz-skills@latest update --flat`. Without `--scope` it looks for the existing flat install and updates it in place. This works for a user-scope flat install. It also finds a project-scope or local-scope flat install in the current project (the scope is recorded in `.claude/vz-skills/manifest.json`). If you have a flat install at user scope and another in this project, it stops with exit code 2 and asks you to pass `--scope`. It does not imply `--force`: a skill or agent of the same name that you created since the install still stops the update.
- Session-only (`--plugin-dir`): pull the repository; the next session uses the new files.
- Marketplace install: `claude plugin marketplace update vz-skills-marketplace` then `claude plugin update vz-skills@vz-skills-marketplace`, or **Update now** in `/plugin`. Local marketplaces do not auto-update by default.

## Roll back

`plugin.json` carries a `version`. To pin an older version: check out the matching git tag or commit in the VZ-skills clone and run the update commands above (a directory marketplace is read in place). To go back to no plugin, uninstall.

## Uninstall - *verified (npm and marketplace forms, isolated config directory)*

- npm: `npx vz-skills uninstall [--scope ...]` removes the plugin at that scope (default `user`); `--purge` also removes the marketplace registration and `~/.vz-skills/marketplace`. If the plugin is not installed at that scope it says `Plugin vz-skills@vz-skills-marketplace is not installed at scope <scope>.`; pass the scope you installed with.
- npm, flat: `npx vz-skills uninstall --flat [--scope ...]` removes the skills, agents, runtime directory, and VZ hook entries that the install recorded. `--scope` must match the install: a flat install made with `--scope local` is refused by `uninstall --flat --scope project` (and the other way round), with nothing changed and a message naming the right scope. `settings.json` is parsed before anything is deleted, so a malformed file stops the uninstall cleanly. With nothing installed it prints `Nothing to uninstall: no flat install at scope <scope>.` `--purge` cannot be combined with `--flat`.
- Session-only: stop passing `--plugin-dir`. Nothing was written to your settings.
- Marketplace install: `claude plugin uninstall vz-skills@vz-skills-marketplace [--scope ...]`; to remove the marketplace too, `claude plugin marketplace remove vz-skills-marketplace` (this also uninstalls its plugins). Delete `.vz-skills/` from projects if you no longer want the config and cache.

What is left behind on purpose:

- `.vz-skills/config.json` in projects where you ran `setup` (it is yours), and `~/.vz-skills/config.json` if you created one;
- `~/.vz-skills/` itself, unless you ran `uninstall --purge` (which removes `~/.vz-skills/marketplace` only);
- after a flat install: the `settings.json.vz-backup-<timestamp>` files beside your settings file (the last three), and `vz-skills-backups/` in your Claude config directory or `.claude/` if you ever used `--force`. Delete them by hand once you no longer need them.

## Troubleshooting

See `docs/troubleshooting.md`.
