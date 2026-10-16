# VZ Skills - Competitive Gap Analysis

Completed 2026-10-16 from the sources in `source-register.md`. Every claim below is either observed (O) from a cited source or an interpretation (I). No claim of superiority is made.

## Executive summary

- **User problem (I):** developers run coding agents across unfamiliar repositories with ambiguous requirements, uneven test coverage, and very different risk levels. Static CLAUDE.md instructions are either too generic or too long, and they say nothing about *this* repository's actual tooling or the rigor the task deserves.
- **Strongest evidence-backed opportunity (I):** none of the three reference projects ships a *deterministic* repository discovery tool that labels its findings CONFIRMED / INFERRED / UNKNOWN, nor a validated configuration layer that scales ceremony to a profile. Both are implementable as plain scripts and are testable with fixtures, which is where VZ Skills concentrates its engineering.
- **Capabilities native Claude Code already provides (O, S-02..S-08):** skills, namespaced plugin skills, subagents, hooks with permission decisions, permission rules and sandboxing, plan mode, `/skill-doctor`, `claude plugin validate`, `claude plugin eval`. VZ Skills builds on these and never re-implements them.
- **Proposed differentiators (I):** (1) grounded discovery with evidence labels and injection-indicator scanning; (2) schema-validated profiles (FAST / BALANCED / PRODUCTION) with safety floors; (3) an evidence-first lifecycle whose final report must use IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED; (4) small deterministic hooks that *advise* the native permission system rather than claim to replace it.
- **Largest risks/unknowns (I):** platform conventions change quickly (the docs show a weekly changelog); `claude plugin eval` requires a newer CLI than the one available here; behavioral value of skills is hard to measure without paid eval runs.

## Reference project comparison

| Project | Intended focus (evidence) | Strengths | Trade-offs | Reusable lessons | License / attribution |
|---|---|---|---|---|---|
| obra/superpowers (S-12) | A complete development *methodology*: brainstorm -> plan -> execute (often via subagents) -> verify, with TDD and systematic debugging (O). | Strong opinionated workflow; verification-before-completion; large adoption. | Opinionated process can be heavy for small tasks; multi-harness packaging adds surface area (O: per-harness plugin dirs). | Make "verify before claiming done" a first-class skill; keep debugging systematic. | MIT. Ideas only; no text reused. |
| addyosmani/agent-skills (S-13) | 24 lifecycle skills + a router skill, commands, agent personas, shared checklists, evals and CI validation (O). | Clear routing meta-skill; anti-rationalization tables; progressive disclosure; evals present. | Many skills increase listing context cost (O: Claude Code truncates descriptions when the listing overflows, S-03); shared `references/` can break when skills are installed individually (O). | A router skill; keep each SKILL.md short and push detail to reference files; validate structure in CI. | MIT. Ideas only. |
| mattpocock/skills (S-14) | Small composable skills; explicit split between user-invoked and model-invoked skills; alignment interviews; a per-repo setup skill (O). | Minimal, adaptable; user keeps control of process; setup skill stores repo preferences. | Few deterministic tools; relies on the model to follow prose. | Separate user-invocable entry points from model-invoked workflow skills; a `setup` skill that writes a project config. | MIT. Ideas only. |
| Native Claude Code (S-02..S-11) | Platform primitives: skills, agents, hooks, permissions, sandbox, plan mode, evals (O). | Authoritative enforcement lives here (permissions, sandbox). Validation and eval tooling built in. | No opinion about workflow rigor; no repository discovery beyond CLAUDE.md and the model's own exploration. | Use native enforcement; never claim a hook is a security boundary (O: "use the permission system for hard allow or deny rules", S-05). | n/a |

## Candidate differentiators

### D1 - Grounded repository discovery (build)
- **Hypothesis:** a deterministic script that reports stack, tooling, commands, instructions, and git state with CONFIRMED/INFERRED/UNKNOWN labels reduces fabricated commands and skipped checks.
- **Evidence gap addressed:** none of the reference projects ships such a tool (O, S-12..S-14 summaries list no discovery script).
- **User benefit:** correct test/lint commands on the first try; explicit unknowns instead of guesses.
- **Implementation cost:** one Node script, fixtures, tests. Low.
- **Risks:** heuristics misclassify unusual stacks -> mitigated by UNKNOWN labelling and an `unknown-stack` fixture.
- **Evaluation method:** fixture matrix (TC-004..TC-013) with exact expected labels.
- **Decision:** build.

### D2 - Validated profiles with safety floors (build)
- **Hypothesis:** FAST/BALANCED/PRODUCTION profiles that change concrete behaviour (planning threshold, test scope, review depth, report format) make rigor adjustable without editing skills.
- **Evidence gap addressed:** reference projects configure via prose or a setup skill; none validates a schema or protects safety settings from typos (O/I).
- **User benefit:** one knob for ceremony; actionable errors on bad config.
- **Implementation cost:** JSON schema-like validator in Node, no dependencies. Low.
- **Risks:** profiles become label-only. Mitigation: every profile difference is a resolved field that skills read, and tests assert the differences.
- **Evaluation method:** config tests (TC-002, TC-003, TC-013) and skill text that branches on resolved fields.
- **Decision:** build.

### D3 - Evidence-first lifecycle and status vocabulary (build)
- **Hypothesis:** forcing a final report to label each claim IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED reduces false claims of verification.
- **Evidence gap addressed:** superpowers and agent-skills both require verification (O) but use free-form wording; a fixed vocabulary is machine-checkable in evals (regex graders).
- **Decision:** build (skills `verify`, `test`, and the shared policy injected at session start).

### D4 - Advisory hooks (build, narrowly)
- **Hypothesis:** a `PreToolUse` command guard that returns `ask` for risky shell commands and `deny` for catastrophic ones, plus a write guard for sensitive paths and obvious secrets, catches common accidents cheaply.
- **Risks:** false positives annoy; hooks run on every Bash call. Mitigation: deterministic regexes, sub-100 ms Node execution, configurable mode, documented fail-open semantics.
- **Decision:** build three hooks only (command guard, write guard, session context). Reject: Stop-hook nagging, network hooks, formatting hooks (project-specific).

### D5 - Specialist subagents (build, three)
- **Hypothesis:** fresh-context review is more independent than self-review in the same conversation (I, consistent with S-06's description of context isolation).
- **Decision:** build `repo-analyst` (read-only discovery), `independent-reviewer` (read-only diff review), `security-reviewer` (read-only threat-focused review). Reject performance and docs agents for v1: no evidence delegation beats an in-context skill there.

## Explicit non-goals

- Re-implementing permissions, sandboxing, or approval prompts (native).
- A Stop hook that forces re-verification loops (native plan mode and the `verify` skill cover it; loops are capped by the platform anyway).
- Formatting/linting hooks (project-specific; discovery reports the commands instead).
- Other runtimes (DEC-001).
- Benchmark "superiority" claims (no fair sample available; see `docs/testing-and-evaluation.md`).
- Legacy `commands/` directory (docs say prefer skills; DEC-005).

## Sources and confidence

See `source-register.md`. Confidence is high for platform conventions (official docs read the same day and cross-checked against the installed CLI's `--help`), medium for reference-project internals (README-level inspection), and low for any behavioural claim about skill effectiveness (no eval data yet).
