# VZ Skills

An evidence-driven development lifecycle for Claude Code. VZ Skills discovers a repository before touching it, turns vague requests into checkable acceptance criteria, plans in small verified slices, runs the right tests, reviews its own work, and reports exactly what was verified and what was not.

Source, full documentation, and issue tracker: <https://github.com/vaibhavzapadiya/vz-skills>

## What you get

- **24 skills**, invoked as `/vz-skills:<name>`. The router (`using-vz-skills`) classifies each request and runs the right steps: `discover`, `clarify`, `plan`, `implement`, `test`, `debug`, `review`, `security-review`, `verify`, plus specialists (`performance`, `frontend`, `backend`, `database`, `api-design`, `docs`, `release`) and productivity skills (`checkpoint`, `pr`, `standup`, `explain`, `retro`).
- **3 read-only agents** (`repo-analyst`, `independent-reviewer`, `security-reviewer`). They can read and search files only; they cannot run commands or edit anything.
- **3 advisory hooks** that ask before risky shell commands and sensitive file writes, deny a short list of catastrophic commands, and add the active profile and a short repository brief at session start.
- **Profiles** (FAST, BALANCED, PRODUCTION) set in an optional `.vz-skills/config.json`. Run `/vz-skills:setup` to create one, or `/vz-skills:status` for a read-only self-check.

## What it runs, reads, and writes

The plugin has no runtime dependencies and makes no network requests. Nothing is downloaded, and no data leaves your machine.

- **Hooks** run `node` on the bundled scripts in `scripts/hooks/`. `command-guard.js` and `write-guard.js` read the pending tool call and answer allow, ask, or deny; they never run the command themselves. `session-context.js` reads the project's manifests and runs read-only `git` commands (branch, status) to build the session brief.
- **Discovery** (`/vz-skills:discover`) reads project files, runs read-only `git` commands, and checks which tools are installed with `which`/`where` and `<tool> --version`. With `--run-baseline` it runs the project's own test command, but only when that command matches a fixed allowlist (such as `npm test`, `pytest`, `go test ./...`, `cargo test`); anything else is reported as BLOCKED for you to run yourself. Secret values found in output are redacted.
- **Files written**: a discovery cache in `.vz-skills/cache/`, a config file when you run `/vz-skills:setup`, and a report file only when you ask for one with `--out`. Writes outside the repository root are refused.
- **Skills** that change code, run tests, commit, push, or publish do so through Claude Code's normal tools and permission prompts. Tagging, pushing, and publishing always ask first.

Hooks fail open and are not a security boundary; Claude Code's own permissions remain authoritative.

## License

MIT. See [LICENSE](LICENSE).
