# Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| `/vz-skills:...` does not autocomplete | plugin not loaded for this session | `claude plugin list` (add `--plugin-dir <path>` in front if you use the session-only form); check `/plugin` **Errors** tab; run `/reload-plugins` |
| `claude plugin validate` warns about an unknown field | a frontmatter or manifest key not in the official list | run `node plugins/vz-skills/scripts/vz-validate.js` for the exact file; remove or rename the field |
| Session starts without the VZ brief | `hooks.session_context: false`, hooks disabled platform-wide (`disableAllHooks`), or the hook failed | run `/vz-skills:status`; run the hook by hand: `echo '{"hook_event_name":"SessionStart","cwd":"."}' \| node plugins/vz-skills/scripts/hooks/session-context.js` and read stderr |
| Every shell command asks for confirmation | the command guard is matching something in your command (for example `sudo` or `rm -r`) | read the reason in the prompt; it names the category. Adjust the command, or set `approvals.*` / `hooks.protected_paths` deliberately |
| A shell command is denied | it matched a catastrophic pattern (see `docs/hooks.md`) | run it yourself in a terminal if you are sure; VZ will not run it |
| `vz-config.js` exits 1 | configuration error; floors enforced meanwhile | read the `ERROR:` lines; each names the key, the allowed values, and the fix |
| `WARNING: SAFETY DOWNGRADE acknowledged` on every session | you listed a floored key in `safety.acknowledged_overrides` | expected; remove the override to stop the warning |
| Discovery reports a command as UNKNOWN | no manifest script, Makefile target, or CI step established it | tell the skill the command, or add a script to the manifest; VZ will not guess |
| Discovery reports CONFLICTING package manager | lockfile vs instruction files disagree | prefer the lockfile; fix the stale instructions |
| Baseline is BLOCKED: "not on the baseline allowlist" | the test command is not a well-known form (`npm test`, `pytest`, `go test ./...`, ...) | run it yourself and tell VZ the result, or add the standard script |
| `claude plugin eval` refuses to run or errors immediately | CLI older than the documented 2.1.269 minimum, or Bash granted on native Windows (no sandbox backend) | update Claude Code; keep eval cases read-only on Windows or run under WSL2 |
| `tests/platform.test.js` skipped | `claude` not on PATH | install Claude Code or run the rest of the suite |
| Hook output appears garbled on Windows | a shell-form hook with unquoted paths | VZ uses exec form; if you copied a hook into settings, keep `"command": "node", "args": [...]` |
| Secrets appear in a report | should never happen; report it as a bug | the write guard, discovery redaction, and policy all aim to prevent this; open an issue with a redacted example |

Debugging tips

- `claude --debug` shows hook invocations and skill loading.
- `node plugins/vz-skills/scripts/vz-config.js --explain --project .` shows every effective value and its source.
- `node plugins/vz-skills/scripts/vz-discover.js . --format json` is the full discovery report; `--format md` the readable one.
- `npm test` in this repository runs 60+ checks in under a minute without network access.
