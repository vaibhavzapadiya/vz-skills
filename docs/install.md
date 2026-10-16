# Install, update, roll back, uninstall

Every command below was taken from the official Claude Code plugin documentation (accessed 2026-10-16, see `docs/research/source-register.md`) and the ones marked *verified* were executed on Claude Code **2.1.259** on Windows 11 during the build (see `project/PROGRESS.md` for the log).

## Prerequisites

| Requirement | Why | Check |
|---|---|---|
| Claude Code >= 2.1.233 (2.1.259 or later recommended) | plugin `--plugin-dir`, `claude plugin validate --json` (>= 2.1.259), directory validation (>= 2.1.233) | `claude --version` |
| Node.js >= 18 | hooks and scripts are dependency-free Node (Claude Code itself runs on Node) | `node --version` |
| git (optional) | discovery reports branch and dirty files; everything else works without it | `git --version` |

No npm packages are installed by VZ Skills. Nothing is downloaded at runtime.

## Option A: try it for one session (no install) - *verified*

From any project directory:

```bash
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills
```

The plugin loads as `vz-skills@inline`. Confirm inside the session with `/plugin` (Installed tab) or from a shell:

```bash
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills plugin list
claude --plugin-dir /path/to/VZ-skills/plugins/vz-skills plugin details vz-skills
```

Observed output on 2.1.259: `vz-skills@inline ... Status: ✔ loaded`, and `details` lists 19 skills, 3 agents, and 2 hook events.

## Option B: install from the local marketplace - *add step verified; install step verified*

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

Expect `vz-skills@vz-skills-marketplace` with `Status: ✔ loaded`. In a session, type `/vz-skills:` and the skills should autocomplete; run `/vz-skills:status` for a read-only self-check.

## Option C: from a git host

Push this repository to a git host and add it as a marketplace by URL, for example `claude plugin marketplace add your-org/vz-skills` for GitHub or the full clone URL for other hosts. Then install as in Option B. Not exercised during the build (no remote was configured): **NOT VERIFIED**.

## First use in a project

1. `/vz-skills:status` to see the effective profile (BALANCED by default) and a repository brief.
2. `/vz-skills:setup BALANCED` (or FAST / PRODUCTION) to create `.vz-skills/config.json`. Nothing else in the project is touched. See `docs/configuration.md`.
3. Start a task; the `using-vz-skills` skill routes it, or invoke skills directly (`/vz-skills:discover`, `/vz-skills:plan`, ...). The catalog is in `docs/skills-catalog.md`.

## Update

- Session-only (`--plugin-dir`): pull the repository; the next session uses the new files.
- Marketplace install: `claude plugin marketplace update vz-skills-marketplace` then `claude plugin update vz-skills@vz-skills-marketplace`, or **Update now** in `/plugin`. Local marketplaces do not auto-update by default.

## Roll back

`plugin.json` carries a `version`. To pin an older version: check out the matching git tag or commit in the VZ-skills clone and run the update commands above (a directory marketplace is read in place). To go back to no plugin, uninstall.

## Uninstall - *verified for the session-only form; marketplace form documented from the official reference*

- Session-only: stop passing `--plugin-dir`. Nothing was written to your settings.
- Marketplace install: `claude plugin uninstall vz-skills@vz-skills-marketplace [--scope ...]`; to remove the marketplace too, `claude plugin marketplace remove vz-skills-marketplace` (this also uninstalls its plugins). Delete `.vz-skills/` from projects if you no longer want the config and cache.

What is left behind on purpose: `.vz-skills/config.json` in projects where you ran `setup` (it is yours), and `~/.vz-skills/config.json` if you created one.

## Troubleshooting

See `docs/troubleshooting.md`.
