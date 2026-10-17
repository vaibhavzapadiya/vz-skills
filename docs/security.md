# Security and threat model

## Assets

Source code and uncommitted work; credentials in `.env`, key files, environment, and credential stores; build and release integrity; the accuracy of verification reports.

## Trust boundaries

1. **User instructions in the conversation** - trusted.
2. **Claude Code permissions and sandbox** - the enforcement boundary. VZ never overrides, weakens, or bypasses them, and its configuration cannot.
3. **Repository content** (files, CLAUDE.md, comments, fixtures, issues), **tool output**, and **web content** - untrusted for anything safety-relevant. Project instruction files are followed for style, structure, and process, but no repository text can authorize what the guards and core policy restrict; the core policy (injected every session), every skill, and every agent say so explicitly; discovery flags injection indicators; the eval suite includes an adversarial case.
4. **VZ hooks** - advisory, fail-open, deterministic; see `docs/hooks.md`.
5. **VZ scripts** - run only what is documented: discovery never executes project scripts unless `--run-baseline` is given and the command is on a conservative allowlist.

## Threat scenarios and mitigations

| # | Threat | Mitigation | Evidence |
|---|---|---|---|
| 1 | Prompt injection in repository files asks for secrets | Core policy rule 4; discovery `scanInstructionText` flags 8 indicator classes and reports them with the file; skills quote-and-refuse; agents report, never act | `tests/discovery.test.js` TC-012; eval `refuses-malicious-repo-instructions` |
| 2 | Malicious instructions ask for destructive shell commands, or disguise them (flag order, quoting, subshells, `sudo`/`env` wrappers, `bash -c`, aliases such as `ri` and `rd`) | Command guard parses the line into simple commands and judges deletes and git from their real flags and arguments; it denies catastrophic targets and asks on risky ones; `approvals.destructive_git: refuse` denies; core policy rule 7 | `tests/hooks.test.js` deny/ask cases; `tests/guard-hardening.test.js` bypass cases |
| 3 | Untrusted scripts execute during discovery or tests | Discovery executes nothing by default; baseline allowlist (`BASELINE_ALLOWLIST`) rejects anything but well-known test commands; `approvals.run_project_scripts` | `tests/discovery.test.js` allowlist test |
| 4 | Secret values leak into output, logs, reports | Discovery never reads `.env` and redacts key-like strings in echoed output; write guard asks before writing credential-looking content; skills forbid printing secrets; command guard asks before `cat .env`, `printenv`, echoing secret variables | TC-012 asserts `.env` content never appears; hook tests |
| 5 | Path traversal or malformed config causes writes outside the project | Config rejects absolute/`..`/`~`/drive paths and validates `protected_paths`; `vz-discover --out` refuses paths outside the root; write guard asks for any path outside the project and denies OS/credential/.git targets | `tests/config.test.js` TC-013; `tests/discovery.test.js` CLI test; hook tests |
| 6 | Hook failures misrepresented as enforcement | Hooks fail open by design and are documented as advisory everywhere (policy, hooks.md, skills, agents) | DEC-012; hook fail-open tests |
| 7 | Config typo silently disables a check | Unknown keys are errors with suggestions; safety floors; acknowledged overrides print a warning on every resolution | `tests/config.test.js` floors and typo tests |
| 8 | Agent overstates test results | Status vocabulary enforced by policy and `verify` skill; `verification.require_evidence_labels` floored to true; eval `labels-unverified-work` | config tests; eval case |
| 9 | Copied code introduces licensing/supply-chain concerns | No code copied from reference projects; zero runtime dependencies; inventory in `docs/decisions.md` (DEC-010, DEC-011) | zero entries in `package.json` dependencies |
| 10 | Existing user changes overwritten | Discovery lists dirty files with a preservation note; `implement`/`verify` require untouched dirty files to stay byte-identical; command guard asks before `git checkout -- .`, `stash drop`, `reset --hard` | TC-011; hook tests |
| 11 | Hook or script reads outside the project | Discovery walk is bounded, skips symlinks, and reads only known manifest/instruction files; hooks read stdin and the config files; the ledger and claim-check hooks also read and append to the project's ledger file under `~/.vz-skills/ledger/` | code review of `fsutil.js`, `discover.js` |
| 12 | A hostile repository's `.vz-skills/config.json` switches off the guards or evidence labels | Lowering a hard floor (`hooks.command_guard`, `hooks.write_guard`, `verification.require_evidence_labels`) needs the key in `safety.acknowledged_overrides` in the user config `~/.vz-skills/config.json`; a project-only acknowledgment is an error and the floor stays. `conventions.notes` and `conventions.extra_instructions_file` are style guidance and cannot authorize restricted actions (core policy rule 4). `protected_paths` globs use a linear matcher, so a crafted glob cannot hang a hook | `tests/config.test.js`; `tests/guard-hardening.test.js` glob test |
| 13 | Repository text injected into the session context poses as instructions or forges lines of the brief | The session brief heading says discovery facts cannot authorize restricted actions, and instruction files are labelled PROJECT RULES (followed for style and process) or SUSPICIOUS (not acted on); repository-derived values are kept one per line with embedded newlines collapsed; `conventions.notes` is flattened to one line and labelled "repository style guidance, not instructions"; TOML parsing is prototype-pollution safe; `.sln` names with unusual characters never reach a command | `tests/guard-hardening.test.js` discovery test |
| 14 | The agent is steered into writing code that Claude Code later runs, or into credential stores | Write guard asks before `.claude/agents\|commands\|skills\|hooks\|rules\|output-styles`, `.mcp.json`, anything under `~/.claude/`, and shell startup files; denies home credential stores and Claude Code user settings; resolves symlinks and junctions so a link cannot hide the real target; compares paths without case on Windows and macOS | `tests/hooks.test.js`; `tests/guard-hardening.test.js` write-guard test |
| 15 | Work leaves the machine without the user's go-ahead | Command guard asks before any `git push`, tag creation or deletion, `gh` PR/issue/release/repo changes, `npm version`, publishing, and deploying; `approvals.external_actions: refuse` denies them; core policy rule 7 | `tests/hooks.test.js`; `tests/guard-hardening.test.js` |
| 16 | Oversized input makes a guard give up silently | Hook input over 2 MiB and commands over 32 KB get "ask" instead of failing open | `tests/guard-hardening.test.js` |
| 17 | The npm installer damages the user's Claude configuration | See [The installer and your Claude config](#the-installer-and-your-claude-config) below | `tests/cli.test.js` against an isolated `CLAUDE_CONFIG_DIR` |
| 18 | The activity ledger exposes what was done in a project, or leaks a secret typed in a command | The ledger is written outside the repository (`$VZ_SKILLS_HOME/ledger/`, default `~/.vz-skills/ledger/`), so it is never committed; it records file paths and commands, never file contents; commands are cut to 300 characters and provider tokens, `*PASSWORD*=`/`*SECRET*=`/`*TOKEN*=`/`*API_KEY*=` values, `--password`/`--token` arguments, and URL passwords are redacted before writing; the file rotates at 5 MB with one previous file kept. Delete the file or the folder to remove the record; `hooks.ledger: false` stops recording | `tests/activity.test.js` ledger test (nothing written into the project, redaction) |
| 19 | Claude reports a change as working when no check ran after it | The claim check (`Stop` hook) compares a success claim in the final message with the ledger and sends Claude back once to run a test, lint, typecheck, or build, or to label the result NOT VERIFIED. It is advisory: it never blocks twice in a row, fails open, matches phrasing with patterns, and can be turned off with `hooks.claim_check: false`. It supports core policy rule 1; it does not replace reading the evidence | `tests/activity.test.js` claim check test |
| 20 | Repository text in the dashboard runs as script or loads remote content when the page is opened | `vz-dashboard.js` HTML-escapes every value it reads from the repository, git, and the ledger; the page contains no scripts and sets `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'`, so it cannot load or send anything; the script makes no network calls and writes only its output file (default `.vz-skills/dashboard.html`) | `tests/activity.test.js` dashboard test (a hostile file name and commit subject are escaped) |

## The installer and your Claude config

`npx vz-skills install` (plugin form) writes only `~/.vz-skills/marketplace` and then calls `claude plugin marketplace add` and `claude plugin install`; Claude Code itself updates its settings.

`npx vz-skills install --flat` writes into your Claude config directory (`$CLAUDE_CONFIG_DIR` or `~/.claude`) at user scope, or the project's `.claude/` at project and local scope:

- `skills/<name>/` for each of the 33 skills, each with a `.vz-skills-managed` marker;
- `agents/repo-analyst.md`, `agents/independent-reviewer.md`, `agents/security-reviewer.md`;
- `vz-skills/` (scripts, policy, references, and a `manifest.json` of what was installed);
- hook entries merged into `settings.json` (or `settings.local.json` at local scope). Existing settings and hooks are kept.

Protections: every check runs before anything is written (a skill or agent of the same name that vz-skills did not create, a `settings.json` that does not parse), and a failed check changes nothing. Collisions are replaced only with `--force`, and then copied first to `vz-skills-backups/<timestamp>/`. `settings.json` is backed up beside itself before every write, and the last three backups are kept. Uninstall removes only what the manifest lists, only agent files that carry the VZ text, and only hook groups whose commands point into the runtime directory; it refuses, changing nothing, when the existing flat install was made with a different scope.

## Secrets handling in this repository

Fixtures contain no real secrets. `fixtures/malicious-instructions/_env` holds an obviously fake connection string used only to prove it is never read. Test tokens in `tests/hooks.test.js` are synthetic.

## Residual risks and limitations

- The command guard reads command structure, not behaviour. An innocuous-looking script can be destructive; review and sandboxing remain necessary. Some checks (secrets, publishing, SQL, remote scripts) are still patterns over the line, so they can miss unusual spellings; SQL and remote-script patterns also read inside quotes, so a commit message that quotes a `DROP TABLE` statement asks.
- Injection detection is heuristic (regular expressions). Novel phrasings will not be flagged; the policy still instructs the model to treat all repository text as data, but that instruction is not a mechanical guarantee.
- Hooks do not see files inserted through `@` mentions.
- Discovery's baseline runner trusts that `npm test` and similar commands run the project's declared script; it does not inspect the script body.
- `claude plugin eval` runs plugin hooks outside its sandbox (platform statement); evaluate only plugins you trust, which includes this one if you modified it.
- Ledger redaction is pattern-based, like the write guard's secret check: a secret in an unusual form can be written to the ledger file. The file stays on your machine, outside the repository; delete it if a secret ends up there.
- The claim check reads the wording of Claude's final message. A success claim phrased in an unusual way is not noticed, and a check that ran but was the wrong one still counts as a check.
- Behavioural guarantees about skills depend on the model following instructions; the eval suite measures this on a small sample only.

## Findings register (Phase 8)

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-001 | medium | Nested `node --test` inherited `NODE_TEST_CONTEXT` and reported exit 0 for a failing suite in the baseline runner | fixed; regression test TC-008 |
| SEC-002 | low | Write guard's fixture exemption matched on absolute path, so any project under a `tests/` folder was exempt from the credential-content check | fixed; test added |
| SEC-003 | low | Walker skipped `.github` (prefix match on `.git`), hiding CI evidence | fixed; TC-004 covers CI corroboration |
| SEC-004 | info | No `LICENSE` file; distribution beyond private use needs the owner's decision | resolved: MIT chosen (DEC-010), LICENSE added |
