# Hooks

VZ Skills ships three hooks, declared in `plugins/vz-skills/hooks/hooks.json` using the schema from the official hooks reference (accessed 2026-10-16). They are implemented as dependency-free Node scripts under `scripts/hooks/` and run in **exec form** (`"command": "node", "args": [...]`) so no shell quoting is involved on any platform.

**They are advisory.** A hook can ask, deny, or stay silent; Claude Code's permission system and sandbox remain the enforcement boundary. A hook that crashes, times out, or receives malformed input makes **no decision** (exit 0, nothing on stdout, a one-line note on stderr). This is deliberate (DEC-012): a guard must not break every command when something unexpected happens, and the platform does not block on timeouts by default on this CLI version anyway. One exception: input too large to inspect gets **ask**, not silence (see [Size limits](#size-limits)).

| Event | Matcher | Script | Timeout | What it does |
|---|---|---|---|---|
| `PreToolUse` | `Bash\|PowerShell` | `command-guard.js` | 10 s | `deny` catastrophic commands; `ask` for risky ones and for anything that leaves the machine; silent otherwise |
| `PreToolUse` | `Write\|Edit\|MultiEdit\|NotebookEdit` | `write-guard.js` | 10 s | `deny` writes into `.git/` internals, home credential stores, OS dirs, Claude Code user settings; `ask` for secrets files, agent instructions and Claude Code config, shell startup files, VZ config, lockfiles, paths outside the project, `hooks.protected_paths`, and credential-looking content |
| `SessionStart` | `startup\|resume\|clear\|compact` | `session-context.js` | 20 s | injects `additionalContext`: the core policy, the effective profile summary, and a brief discovery (depth 3, no tool probing), capped at 9,000 characters |

Plugin hooks fire in every session where the plugin is enabled, for every matching tool call, whether or not a VZ skill is in use. Measured latency in `tests/hooks.test.js` is well under the 2.5 s budget the test enforces (typically 100-300 ms per call on the build machine, dominated by Node start-up).

## Command guard

### How commands are read

The guard does not match the raw command line for deletes and git. It splits the line into simple commands at `;`, `&&`, `||`, `|`, `&`, newlines, parentheses, braces, backticks, and `$( )`, outside quotes. Each simple command is tokenized with quotes removed, and leading wrappers are skipped (`sudo`, `doas`, `command`, `exec`, `nohup`, `time`, `nice`, `env`, `xargs`, `builtin`, `call`, `&`, `.`, and `NAME=value` assignments). `rm` / `Remove-Item` (and the aliases `ri`, `del`, `erase`, `rd`, `rmdir`), `find`, `format`, and `git` are then judged from their real flags and arguments, so flag order (`-rf`, `-fr`, `-r -f`, `--recursive`), quoting (`"$HOME"`), and subshells do not change the outcome. `git -C <dir>` and `git -c key=value` do not hide the subcommand.

Text inside quotes is not a command: `git commit -m "never run git push --force origin main"` is just a commit. The exception is the argument of `bash -c` / `sh -c` (and `zsh`, `dash`, `ksh`), `pwsh -Command` / `powershell -c`, `cmd /c`, `eval`, `iex`, and `Invoke-Expression`, which is read as a command line of its own (up to three levels deep). For PowerShell tool calls, PowerShell's backtick escapes and line continuations are used instead of Bash's backslash.

The remaining checks are patterns over the line. For `sudo`, secrets, publishing and deploying, and global installs, quoted text that contains spaces (a commit message, an `echo` string) is blanked first, so `git commit -m "docs: explain npm publish"` does not ask; a single quoted word such as `cat ".env"` is still read. The remote-script and SQL patterns, and `mkfs`-style checks, also look inside quotes, because SQL and downloaded scripts are usually passed in quotes (`psql -c "DROP TABLE ..."`, `bash -c "$(curl ...)"`).

### Deny (irreversible or out of scope)

- Recursive delete (`rm -r`/`-R`/`--recursive` in any flag group, `Remove-Item -Recurse` or any prefix such as `-r`, `rd /s`, `del /s`) of:
  - the filesystem root `/`;
  - the home directory: `~`, `$HOME`, `${HOME}`, `$env:USERPROFILE`, `$env:HOME`, `%USERPROFILE%`, `%HOMEPATH%`;
  - the whole working directory: `.`, `./`, `*`, `./*`;
  - a parent directory: `..`, `../..`, ...;
  - a drive root: `C:\`, `C:/`, `C:`, `/c`, `/mnt/c`;
  - a system directory: `/bin`, `/boot`, `/dev`, `/etc`, `/home`, `/lib`, `/lib64`, `/opt`, `/proc`, `/root`, `/sbin`, `/srv`, `/sys`, `/usr`, `/var`, `/System`, `/Library`, `/Users`, `/Applications`, `C:\Windows`, `C:\Program Files`, `C:\Program Files (x86)`, `C:\Users`, `C:\ProgramData`.

  A trailing `/*` counts the same (`rm -rf /etc/*`).
- Any delete command with `--no-preserve-root`.
- `find <start> -delete` or `find <start> -exec rm|shred` with no filter (no `-name`, `-type`, `-path`, `-mtime`, ...) when `<start>` is one of the targets above, because that deletes everything under it. With a filter it asks instead: `find . -name '*.tmp' -delete` is everyday cleanup.
- `format` with a drive letter (`format c:`), `mkfs`, `dd of=/dev/sd*` (and `hd`, `nvme`, `disk`, `mmcblk`), redirecting into a block device, fork bombs, `chmod 777 /` and `chmod -R 777 /`.
- `git push` that force-pushes or deletes `main` or `master`, in any argument order: `--force`, `-f`, `--force-with-lease`, `--force-if-includes`, `--delete`, `-d`, and the refspec forms `+main`, `:main`, `HEAD:main`, `refs/heads/main`.

### Ask (confirm with the user)

- **Destructive git** (`approvals.destructive_git`): `reset --hard|--merge|--keep`; `clean -f`/`--force`; `checkout --`, `checkout .`, `checkout -f`; `restore` of paths (not `restore --staged` alone); `stash drop|clear`; `branch -D` or `--delete --force`; `push --force|--delete|--mirror` to branches other than `main`/`master`; `rebase -i`; `filter-branch`, `filter-repo`; `reflog expire`.
- **External actions** (`approvals.external_actions`):
  - any `git push`, and `git tag <name>` (creating or deleting; `git tag`, `git tag -l` and other listing forms stay quiet);
  - `gh pr create|merge|close|comment|edit|review`, `gh issue create|close|comment|edit`, `gh release create|delete|edit|upload`, `gh repo delete|create|edit`;
  - `npm|pnpm|yarn publish`, `cargo publish`, `twine upload`, `gem push`, `docker push`;
  - `npm|pnpm|yarn version <v>` (it creates a commit and a tag), unless `--no-git-tag-version` is given;
  - `terraform apply|destroy`, `pulumi up|destroy`, `serverless deploy`, `vercel deploy`/`vercel --prod`, `netlify deploy`, `fly deploy`;
  - `kubectl delete|apply|replace|scale|rollout|drain|patch`, unless `--dry-run` is given;
  - `heroku container:release|releases:rollback|apps:destroy|pg:reset|config:set|config:unset|run` (read-only `heroku` commands stay quiet).
- **Recursive deletes** of any other target, and `find ... -delete` / `-exec rm`.
- **Remote scripts**: `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`, `iwr`, `irm` piped into `sh`, `bash`, `zsh`, `dash`, `ksh`, `python`, `node`, `pwsh`, `powershell`, `iex`, or `Invoke-Expression`; `bash <(curl ...)`, `source <(curl ...)`, `bash -c "$(curl ...)"`; `iex` with a download (`iwr`, `irm`, `DownloadString`, `Net.WebClient`).
- **`sudo`**.
- **Secrets**: reading or searching a secret-bearing file with `cat`, `type`, `less`, `more`, `head`, `tail`, `bat`, `Get-Content`, `gc`, `grep`, `rg`, `findstr`, `Select-String`, `sls`, `strings`, `sed`, or `awk`. Secret-bearing means `.env`, `.env.<name>`, `.envrc`, `id_rsa`, `id_ed25519`, `*.pem`, `*.p12`, `*.pfx`, `credentials`, `.netrc`, `.npmrc`, `.pypirc`, `.git-credentials`, `secret(s).json|yaml|yml|toml`. Templates (`.env.example`, `.env.sample`, `.env.template`, `.env.dist`) do not ask. Also: dumping the whole environment (`printenv`, `env`, `set`, `Get-ChildItem env:`, `gci env:`, `dir env:` on their own), and echoing a secret-looking variable (`echo $GITHUB_TOKEN`, `*_SECRET`, `*_PASSWORD`, `*_API_KEY`, ...).
- **Databases**: `DROP TABLE|DATABASE|SCHEMA`, `TRUNCATE`, `ALTER TABLE ... DROP`, `DELETE FROM <table>` without a `WHERE`; `prisma migrate reset`, `prisma db push --force-reset`, `rails db:drop|reset`, `alembic downgrade base`, `knex migrate:rollback --all`, `dotnet ef database drop`.
- **System-wide installs**: `npm|pnpm|yarn install -g`, `pip install --break-system-packages`, `choco|brew|apt|apt-get|winget install`.
- **Protected paths**: `rm`, `Remove-Item` and its aliases, `mv`, `Move-Item`, `move`, `mi`, or `git rm` with a target that matches `hooks.protected_paths`.

A command that hits several categories gets one ask that names all of them.

### Configuration

- `approvals.destructive_git: refuse` turns the destructive-git asks into denies.
- `approvals.external_actions: refuse` turns the external-action asks (including `git push` and tags) into denies. The message then says the command was refused by the approvals policy.
- `hooks.protected_paths` adds globs; they are matched with a linear-time matcher, so a pathological glob cannot hang the hook.
- `hooks.command_guard: off` silences the guard. It needs `hooks.command_guard` in `safety.acknowledged_overrides` **in your user config** (`~/.vz-skills/config.json`); see [Turning a guard off](#turning-a-guard-off).

## Write guard

The guard judges the real location of the write: symlinks and junctions in the path are resolved first, so a link inside the project that points elsewhere is treated as a write outside the project. Path checks ignore case on Windows and macOS, whose default filesystems do.

### Deny

- Anything inside `.git/` except `.git/info/exclude` (use git commands instead).
- Credential stores in your home directory: `~/.ssh`, `~/.aws`, `~/.gnupg`, `~/.kube`, `~/.docker`, `~/.config/gh`, `~/.azure`, `~/.config/gcloud`, and the files `~/.netrc`, `~/.npmrc`, `~/.pypirc`, `~/.git-credentials`.
- Operating-system directories: `/etc`, `/usr`, `/bin`, `/sbin`, `/boot`, `/lib`, `/lib64`, `/sys`, `/proc`, `/dev`, and `<drive>:\Windows`, `Program Files`, `Program Files (x86)`, `ProgramData`.
- Claude Code user settings: `~/.claude.json` and `settings.json` / `settings.local.json` under `~/.claude/`.

### Ask

- A path outside the project root (after resolving links).
- Anything else under `~/.claude/`, and shell startup files in the home directory: `.bashrc`, `.bash_profile`, `.zshrc`, `.zprofile`, `.profile`, `.config/fish/config.fish`, and PowerShell profiles under `Documents/PowerShell` and `Documents/WindowsPowerShell`. These run code in every session.
- `.env` files: `.env`, `.env.<name>`, `<name>.env` (such as `prod.env`), and `.envrc`. Names ending in `.example`, `.sample`, `.template`, or `.dist` are exempt.
- File names that suggest credentials: `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `*.crt`, `*.cer`, `id_rsa`, `id_ed25519`, `id_ecdsa`, `id_dsa` (and `.pub`), `secret(s)` or `credential(s)` with `.json`, `.yaml`, `.yml`, `.toml`, `.txt`, `.env`.
- Agent instructions and code Claude Code runs: `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, `GEMINI.md`, `.cursorrules`, `.mcp.json`, `.claude/settings.json`, `.claude/settings.local.json`, `.claude/CLAUDE.md`, and anything under `.claude/agents/`, `commands/`, `skills/`, `hooks/`, `rules/`, `output-styles/`.
- `.vz-skills/config.json`.
- Lockfiles: `package-lock.json`, `npm-shrinkwrap.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `bun.lockb`, `poetry.lock`, `uv.lock`, `Pipfile.lock`, `Cargo.lock`, `go.sum`, `Gemfile.lock`, `composer.lock`, `packages.lock.json`.
- A path matching `hooks.protected_paths`.
- Content that looks like a credential, in `content`, `new_string`, `new_source`, or `MultiEdit` edits:
  - provider tokens that start at a word boundary (so a kebab-case word containing `sk-` is not one): AWS `AKIA...`, GitHub `ghp_...` and `github_pat_...`, GitLab `glpat-...`, Slack `xox[baprs]-...`, `sk-...` / `sk-proj-...` / `sk-ant-...`, Stripe `sk_live_...`, npm `npm_...`, Google `AIza...`;
  - private key blocks, including `ENCRYPTED PRIVATE KEY`;
  - `password|secret|api_key|access_token|auth_token|token` assigned a quoted value of 16+ characters, in code or JSON style (`"api_key": "..."`);
  - unquoted `SECRET=value` lines (`[export] *PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY*=` with a 12+ character value).

  The content check is skipped when the value is an obvious placeholder (`example`, `changeme`, `your_key`, `xxxx`, `<...>`, `${...}`, `process.env`, `dummy`, `fake`, ...), when the file is a template (`.example`, `.sample`, `.template`, `.dist`), or when it is a test artifact: under `test/`, `tests/`, `__tests__/`, `fixture(s)/`, `__fixtures__/`, `__mocks__/`, `spec(s)/`, `testdata/`, or named `*.test.*` / `*.spec.*`. A plain `mock/` directory is not exempt.

### Configuration

`hooks.write_guard: off` silences the guard, with the same user-config acknowledgment as the command guard. `hooks.protected_paths` adds globs.

## Size limits

- Hook input over 2 MiB is not parsed. Both guards answer **ask** ("too large to inspect") instead of failing open. The session hook fails open.
- Commands longer than 32 KB are not pattern-matched (this bounds the time the guard can take); the command guard answers **ask** ("too long to inspect").

## Session context

Output shape: `{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"..."}}`. Disable with `hooks.session_context: false`. The discovery brief is the same engine as `/vz-skills:discover` with a shallower scan. Its heading says the values below come from the repository and are data, not instructions, and repository-derived values are kept one per line (embedded newlines are collapsed), so a file cannot forge extra lines in the brief.

## Turning a guard off

Lowering `hooks.command_guard` or `hooks.write_guard` to `off` is honoured only when the key is listed in `safety.acknowledged_overrides` in your **user** config, `~/.vz-skills/config.json`. An acknowledgment in a project's `.vz-skills/config.json` is ignored with an error and the guard stays on, because a cloned repository must not be able to switch off the checks that protect you from it. The `off` value itself may sit in either file. See `docs/configuration.md`.

## Disabling

- Per project: set the `hooks.*` keys (the guards need the user-config acknowledgment above; the session brief does not).
- Everything, platform-wide: Claude Code's `"disableAllHooks": true` setting (documented by Claude Code; VZ never writes it). There is no per-hook switch at the platform level.
- Removing the plugin removes its hooks.

## What the hooks do not do

- They do not inspect what a script does; a script named `npm test` that deletes files is not caught by the guard (the discovery baseline runner has the same limitation and says so).
- They do not see `@file` mentions, which Claude Code inserts without a tool call.
- They do not replace code review or sandboxing, and `claude plugin eval` treats plugin hooks as code running outside the sandbox.

## Testing

`npm run test:hooks` exercises: normal pass-through, every deny and ask category, PowerShell input, `refuse` approvals, protected paths, acknowledged and unacknowledged `off`, malformed/empty/wrong-event input for all three hooks (fail-open), broken project config, write-guard deny/ask/content/placeholder/fixture cases, session output shape and size cap, idempotency, and latency. `tests/guard-hardening.test.js` covers bypass attempts: flag order, quoting, subshells, wrappers and aliases, quoted text and look-alike names, oversized and overlong input, a hostile `protected_paths` glob, case variants and links pointing outside the project, and repository text in the discovery brief.
