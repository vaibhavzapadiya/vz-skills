# VZ Skills

An evidence-driven development lifecycle for Claude Code. VZ Skills discovers a repository before touching it, turns vague requests into checkable acceptance criteria, plans in small verified slices, runs the right tests, reviews its own work, and reports exactly what was verified and what was not. It cannot report "done" after a code change without a check that ran.

Source, full documentation, and issue tracker: <https://github.com/vaibhavzapadiya/vz-skills>

## What you get

- **33 skills**, invoked as `/vz-skills:<name>`. The router (`using-vz-skills`) classifies each request and runs the right steps:
  - start here: `setup`, `status`, `discover`, `learn-conventions`;
  - the lifecycle: `clarify`, `plan`, `implement`, `test`, `debug`, `review`, `security-review`, `verify`;
  - specialists: `performance`, `frontend`, `backend`, `database`, `api-design`, `docs`, `adr`, `prove-test`, `deps`, `release`;
  - around the work: `commit`, `checkpoint`, `pr`, `standup`, `explain`, `retro`, `onboard`, `impact`, `ledger`, `dashboard`.
- **3 read-only agents** (`repo-analyst`, `independent-reviewer`, `security-reviewer`). They can read and search files only; they cannot run commands or edit anything.
- **5 advisory hooks**: a command guard and a write guard that ask before risky actions and deny a short list of catastrophic ones; a session brief with the active profile and a short repository brief; an activity ledger; and a claim check that sends Claude back once when it claims success after a code change without running a check.
- **Profiles** (FAST, BALANCED, PRODUCTION) set in an optional `.vz-skills/config.json`. Run `/vz-skills:setup` to create one, or `/vz-skills:status` for a read-only self-check.

## What it runs, reads, and writes

The plugin has no runtime dependencies, and its own scripts make no network requests. Nothing is downloaded, and no data leaves your machine through the plugin.

- **Hooks** run `node` on the bundled scripts in `scripts/hooks/`.
  - `command-guard.js` and `write-guard.js` read the pending tool call and answer allow, ask, or deny; they never run the command themselves.
  - `session-context.js` reads the project's manifests and runs read-only `git` commands (branch, status) to build the session brief.
  - `ledger.js` appends one line per file edit or shell command (tool name, file path or command, pass or fail) to a ledger file in `~/.vz-skills/ledger/`, outside the repository. Commands are truncated to 300 characters and secret-looking values are redacted before they are written. Turn it off with `hooks.ledger: false`.
  - `claim-check.js` reads that ledger and Claude's final message when Claude stops; it writes nothing except a note in the ledger when it sends Claude back. Turn it off with `hooks.claim_check: false`.
- **Discovery** (`/vz-skills:discover`) reads project files, runs read-only `git` commands, and checks which tools are installed with `which`/`where` and `<tool> --version`. With `--run-baseline` it runs the project's own test command, but only when that command matches a fixed allowlist (such as `npm test`, `pytest`, `go test ./...`, `cargo test`); anything else is reported as BLOCKED for you to run yourself. Secret values found in output are redacted.
- **The dashboard** (`/vz-skills:dashboard`) reads the project's configuration, files, ADRs, checkpoint, and ledger, runs read-only `git` commands (`log`, `describe`, `rev-list`), and writes one HTML file. The page has no scripts, loads nothing from the network, and escapes all repository text.
- **Files written**: a discovery cache in `.vz-skills/cache/`, `.vz-skills/checkpoint.md` (`/checkpoint`), `.vz-skills/dashboard.html` (`/dashboard`), a config file when you run `/vz-skills:setup`, the ledger in `~/.vz-skills/ledger/`, and documents (`docs/adr/`, `docs/ONBOARDING.md`) only when you ask for them. Script writes outside the repository root are refused, apart from the ledger.
- **Skills** that change code, run tests, commit, push, or publish do so through Claude Code's normal tools and permission prompts. `/deps` and `/release` run the project's own package manager and audit commands, which contact package registries; `/prove-test` creates and then removes a temporary `git worktree` outside the repository. Tagging, pushing, and publishing always ask first.

Hooks fail open and are not a security boundary; Claude Code's own permissions remain authoritative.

## License

MIT. See [LICENSE](LICENSE).
