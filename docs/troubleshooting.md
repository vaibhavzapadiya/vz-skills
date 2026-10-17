# Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| `npx vz-skills install` says it could not register the marketplace | a `vz-skills-marketplace` already exists from a different path (for example a clone) | `claude plugin marketplace remove vz-skills-marketplace` (uninstalls its plugins), then run the install again; or keep the clone and skip npm |
| `install --flat` stops with "already exist ... not created by vz-skills" | you have your own skill or agent with the same name (for example `plan` or `repo-analyst.md`); nothing was changed | rename yours, or pass `--force` to replace it (it is copied to `vz-skills-backups/<timestamp>/` in your Claude config or `.claude/` first) |
| `install --flat` or `uninstall --flat` says `settings.json is not valid JSON ... nothing was changed` | the settings file named in the message has a syntax error | fix the file by hand, then run the command again |
| `update` fails with "plugin update failed", `uninstall` says `Plugin vz-skills@vz-skills-marketplace is not installed at scope user`, or `uninstall --flat` says `Nothing to uninstall: no flat install at scope user` | the install was made with `--scope project` or `--scope local`, and the command used the default `user` | pass the same `--scope` you installed with, for example `npx vz-skills uninstall --flat --scope project` |
| `update --flat` says flat installs exist in several scopes | you have a flat install at user scope and another in this project | pass `--scope` for the one you want to update |
| `uninstall --flat` says the flat install here was made with `--scope local` (or `project`) | project and local flat installs share `.claude/` but keep hooks in different settings files | run it again with the scope named in the message; nothing was changed |
| A `vz-skills` command exits 2 with `unknown option` | a misspelled or unsupported flag (flags are strict per subcommand) | check `npx vz-skills help`; nothing was run |
| After `install --flat`, `/vz-status` exists but `/status` shows Claude's own status | expected: `status` is renamed to avoid hiding the built-in command | use `/vz-status` for VZ, `/status` for Claude Code |
| Skills appear twice (`/plan` and `/vz-skills:plan`) | both a flat install and a plugin install are active in the same scope | remove one: `npx vz-skills uninstall --flat` or `npx vz-skills uninstall` |
| `npx vz-skills` says Claude Code CLI not found | `claude` is not on PATH in that shell | install Claude Code or open a shell where `claude --version` works |
| `/vz-skills:...` does not autocomplete | plugin not loaded for this session | `claude plugin list` (add `--plugin-dir <path>` in front if you use the session-only form); check `/plugin` **Errors** tab; run `/reload-plugins` |
| `claude plugin validate` warns about an unknown field | a frontmatter or manifest key not in the official list | run `node plugins/vz-skills/scripts/vz-validate.js` for the exact file; remove or rename the field |
| Session starts without the VZ brief | `hooks.session_context: false`, hooks disabled platform-wide (`disableAllHooks`), or the hook failed | run `/vz-skills:status`; run the hook by hand: `echo '{"hook_event_name":"SessionStart","cwd":"."}' \| node plugins/vz-skills/scripts/hooks/session-context.js` and read stderr |
| Every shell command asks for confirmation | the command guard is matching something in your command (for example `sudo` or `rm -r`) | read the reason in the prompt; it names the category. Adjust the command, or set `approvals.*` / `hooks.protected_paths` deliberately |
| `git push`, `git tag v1.2.0`, or `gh pr create` asks for confirmation | expected: anything that leaves the machine asks (see `docs/hooks.md`) | confirm it, or set `approvals.external_actions: refuse` to deny these outright |
| A shell command is denied | it matched a catastrophic pattern (see `docs/hooks.md`) | run it yourself in a terminal if you are sure; VZ will not run it |
| `find . -delete` is denied | a `find -delete` with no filter that starts at `.`, `/`, home, or another root deletes everything under it | add a filter such as `-name '*.tmp'` (then it asks), or run it yourself |
| A guard asks "too large to inspect" or "too long to inspect" | hook input over 2 MiB, or a command over 32 KB | expected; confirm if the content is what you meant, or split it up |
| `hooks.command_guard: off` is ignored with an error about the project config | a hard floor was acknowledged only in the repository's `.vz-skills/config.json` | acknowledge it in `~/.vz-skills/config.json` if you really want it off; see `docs/configuration.md` |
| `vz-config.js` exits 1 | configuration error; floors enforced meanwhile | read the `ERROR:` lines; each names the key, the allowed values, and the fix |
| `WARNING: SAFETY DOWNGRADE acknowledged` on every session | you listed a floored key in `safety.acknowledged_overrides` | expected; remove the override to stop the warning |
| Discovery reports a command as UNKNOWN | no manifest script, Makefile target, or CI step established it | tell the skill the command, or add a script to the manifest; VZ will not guess |
| Discovery reports CONFLICTING package manager | lockfile vs instruction files disagree | prefer the lockfile; fix the stale instructions |
| Baseline is BLOCKED: "not on the baseline allowlist" | the test command is not a well-known form (`npm test`, `pytest`, `go test ./...`, ...) | run it yourself and tell VZ the result, or add the standard script |
| `claude plugin eval` refuses to run or errors immediately | CLI older than the documented 2.1.269 minimum, or Bash granted on native Windows (no sandbox backend) | update Claude Code; keep eval cases read-only on Windows or run under WSL2 |
| `tests/platform.test.js` skipped | `claude` not on PATH | install Claude Code or run the rest of the suite |
| Hook output appears garbled on Windows | a shell-form hook with unquoted paths | VZ uses exec form; if you copied a hook into settings, keep `"command": "node", "args": [...]` |
| Secrets appear in a report | should never happen; report it as a bug | the write guard, discovery redaction, and policy all aim to prevent this; open an [issue](https://github.com/vaibhavzapadiya/vz-skills/issues) with a redacted example |
| `doctor` says installed but not loaded | older `claude plugin list` output words the status differently | `doctor` accepts `Status: loaded` and `Status: enabled`; check `claude plugin list` by hand |

Debugging tips

- `claude --debug` shows hook invocations and skill loading.
- `node plugins/vz-skills/scripts/vz-config.js --explain --project .` shows every effective value and its source.
- `node plugins/vz-skills/scripts/vz-discover.js . --format json` is the full discovery report; `--format md` the readable one.
- `npm test` in this repository runs 102 tests without network access, in about two minutes when `claude` is on PATH (most of that is the install-cycle tests in `tests/cli.test.js`).

Still stuck? Search or open an issue at <https://github.com/vaibhavzapadiya/vz-skills/issues>. Include the details listed in `docs/contributing.md#reporting-issues`.
