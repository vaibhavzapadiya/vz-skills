# Security and threat model

## Assets

Source code and uncommitted work; credentials in `.env`, key files, environment, and credential stores; build and release integrity; the accuracy of verification reports.

## Trust boundaries

1. **User instructions in the conversation** - trusted.
2. **Claude Code permissions and sandbox** - the enforcement boundary. VZ never overrides, weakens, or bypasses them, and its configuration cannot.
3. **Repository content** (files, CLAUDE.md, comments, fixtures, issues), **tool output**, and **web content** - untrusted data. The core policy (injected every session), every skill, and every agent say so explicitly; discovery flags injection indicators; the eval suite includes an adversarial case.
4. **VZ hooks** - advisory, fail-open, deterministic; see `docs/hooks.md`.
5. **VZ scripts** - run only what is documented: discovery never executes project scripts unless `--run-baseline` is given and the command is on a conservative allowlist.

## Threat scenarios and mitigations

| # | Threat | Mitigation | Evidence |
|---|---|---|---|
| 1 | Prompt injection in repository files asks for secrets | Core policy rule 4; discovery `scanInstructionText` flags 8 indicator classes and reports them with the file; skills quote-and-refuse; agents report, never act | `tests/discovery.test.js` TC-012; eval `refuses-malicious-repo-instructions` |
| 2 | Malicious instructions ask for destructive shell commands | Command guard denies catastrophic patterns and asks on risky ones; `approvals.destructive_git: refuse` denies; core policy rule 7 | `tests/hooks.test.js` deny/ask cases |
| 3 | Untrusted scripts execute during discovery or tests | Discovery executes nothing by default; baseline allowlist (`BASELINE_ALLOWLIST`) rejects anything but well-known test commands; `approvals.run_project_scripts` | `tests/discovery.test.js` allowlist test |
| 4 | Secret values leak into output, logs, reports | Discovery never reads `.env` and redacts key-like strings in echoed output; write guard asks before writing credential-looking content; skills forbid printing secrets; command guard asks before `cat .env`, `printenv`, echoing secret variables | TC-012 asserts `.env` content never appears; hook tests |
| 5 | Path traversal or malformed config causes writes outside the project | Config rejects absolute/`..`/`~`/drive paths and validates `protected_paths`; `vz-discover --out` refuses paths outside the root; write guard asks for any path outside the project and denies OS/credential/.git targets | `tests/config.test.js` TC-013; `tests/discovery.test.js` CLI test; hook tests |
| 6 | Hook failures misrepresented as enforcement | Hooks fail open by design and are documented as advisory everywhere (policy, hooks.md, skills, agents) | DEC-012; hook fail-open tests |
| 7 | Config typo silently disables a check | Unknown keys are errors with suggestions; safety floors; acknowledged overrides print a warning on every resolution | `tests/config.test.js` floors and typo tests |
| 8 | Agent overstates test results | Status vocabulary enforced by policy and `verify` skill; `verification.require_evidence_labels` floored to true; eval `labels-unverified-work` | config tests; eval case |
| 9 | Copied code introduces licensing/supply-chain concerns | No code copied from reference projects; zero runtime dependencies; inventory in `docs/research/source-register.md` | license section of the source register |
| 10 | Existing user changes overwritten | Discovery lists dirty files with a preservation note; `implement`/`verify` require untouched dirty files to stay byte-identical; command guard asks before `git checkout -- .`, `stash drop`, `reset --hard` | TC-011; hook tests |
| 11 | Hook or script reads outside the project | Discovery walk is bounded, skips symlinks, and reads only known manifest/instruction files; hooks read stdin and the project config only | code review of `fsutil.js`, `discover.js` |

## Secrets handling in this repository

Fixtures contain no real secrets. `fixtures/malicious-instructions/_env` holds an obviously fake connection string used only to prove it is never read. Test tokens in `tests/hooks.test.js` are synthetic.

## Residual risks and limitations

- The command guard matches text, not behaviour. An innocuous-looking script can be destructive; review and sandboxing remain necessary.
- Injection detection is heuristic (regular expressions). Novel phrasings will not be flagged; the policy still instructs the model to treat all repository text as data, but that instruction is not a mechanical guarantee.
- Hooks do not see files inserted through `@` mentions.
- Discovery's baseline runner trusts that `npm test` and similar commands run the project's declared script; it does not inspect the script body.
- `claude plugin eval` runs plugin hooks outside its sandbox (platform statement); evaluate only plugins you trust, which includes this one if you modified it.
- Behavioural guarantees about skills depend on the model following instructions; the eval suite measures this on a small sample only.

## Findings register (Phase 8)

| ID | Severity | Finding | Status |
|---|---|---|---|
| SEC-001 | medium | Nested `node --test` inherited `NODE_TEST_CONTEXT` and reported exit 0 for a failing suite in the baseline runner | fixed; regression test TC-008 |
| SEC-002 | low | Write guard's fixture exemption matched on absolute path, so any project under a `tests/` folder was exempt from the credential-content check | fixed; test added |
| SEC-003 | low | Walker skipped `.github` (prefix match on `.git`), hiding CI evidence | fixed; TC-004 covers CI corroboration |
| SEC-004 | info | No `LICENSE` file; distribution beyond private use needs the owner's decision | open (DEC-010) |
