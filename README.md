# VZ Skills — Complete Project & Execution Kit

**Technical identifier:** `vz-skills`  
**Runtime for v1:** Claude Code only  
**Purpose:** An execution-ready, quality-gated project package for researching, building, validating, documenting, and releasing VZ Skills.

This package is a comprehensive **build specification, execution protocol, and project-control system**. It is not itself a finished Claude Code plugin. Use it inside the target repository with Claude Code to build the actual plugin and keep all work tracked.

## Start here

1. Copy this kit into the root of the repository where VZ Skills should be built, or unzip it directly into an empty project directory.
2. Open that directory in Claude Code.
3. Read `prompts/00-master-build-prompt.md` and `prompts/01-phased-execution-protocol.md`.
4. Paste the **entire master build prompt** into Claude Code, then paste the **entire phased execution protocol**.
5. Let Claude Code inspect the repository and execute the phases. It should not ask for approval after every phase; it should stop only for genuine blockers, consequential external actions, or required user decisions.
6. Use `project/PROGRESS.md` as the source of truth across sessions. If context is lost, start a new session with `prompts/02-resume-from-checkpoint.md`.

## Package map

- `prompts/` — master build prompt, incremental execution protocol, resume prompt, final audit prompt.
- `project/` — roadmap, progress tracker, decision log, acceptance matrix, risks, known issues, requirements traceability.
- `spec/` — product vision, architecture, skill contract, configuration contract, commands, hooks, agents, security, evaluation, distribution.
- `templates/` — templates Claude Code should use when creating or adding skills, agents, commands, decisions, and tests.
- `quality/` — definition of done, test strategy, release checklist, evidence rules.
- `research/` — source list and competitive analysis plan.
- `tracking/` — issue/phase/feature tracking CSVs and status definitions.

## Quality and truthfulness rules

- Do not claim a feature is implemented until its files and behavior exist.
- Do not claim a test passed unless it was run and its result was observed.
- Do not claim compatibility, security, performance, or superiority without evidence.
- Verify current Claude Code documentation before choosing plugin layout, frontmatter, command syntax, hook events, settings, or distribution details.
- Preserve existing user work. Inspect `git status` and diffs before making changes.
- Do not overwrite a repository's existing `CLAUDE.md`, settings, or configuration without understanding and preserving its intent.
- Build small vertical slices, validate each slice, and update the tracker continuously.
- Use native Claude Code permissions and sandboxing as appropriate; hooks and prompts are not security boundaries by themselves.
- V1 supports Claude Code only. Keep architecture clean, but do not build additional runtimes prematurely.

## Status convention

Use these exact status labels in trackers:
`NOT_STARTED`, `IN_PROGRESS`, `BLOCKED`, `IMPLEMENTED`, `TESTED`, `VERIFIED`, `DEFERRED`, `REJECTED`.

A feature is not `VERIFIED` merely because a file exists. Verification requires evidence appropriate to the feature.
