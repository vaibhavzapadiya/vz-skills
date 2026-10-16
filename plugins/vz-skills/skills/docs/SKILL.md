---
name: docs
description: Write or update documentation that matches the code: README sections, setup and usage guides, API reference, architecture notes, ADRs, and changelog entries, verified against the actual commands and behaviour. Use when docs are part of a change (per the profile's documentation.expectation) or when asked to document something.
argument-hint: "[what to document]"
---

# Documentation

Documentation that is wrong is worse than none. Every command or claim in a doc is verified against the repository before it is written.

## Inputs

- Repository brief: existing docs layout (`README`, `docs/`, `CHANGELOG`, ADR directory), doc tooling (MkDocs, Docusaurus, Sphinx, docfx, mdBook) and its build/lint command if CONFIRMED, conventions (headings, tone, code block languages).
- The change or topic to document, and `documentation.expectation` (none | touched-files | feature-level).

## Workflow

1. **Find where it belongs.** Reuse the existing structure; do not create a parallel docs tree. For `touched-files`, update the sections that describe what changed. For `feature-level`, also add or update a user-facing section and a changelog entry under the current unreleased heading in the project's changelog format (Keep a Changelog, conventional, or whatever is present).
2. **Verify every command** you write by running it (or its `--help`) if it is safe and CONFIRMED by discovery; otherwise copy it exactly from the manifest/CI and say where it came from. Never invent flags.
3. **Verify every behaviour claim** by pointing to the code or test that proves it. Prefer short, concrete examples (input -> output) over prose.
4. **ADRs** (when the task involved a consequential decision and the repo keeps ADRs): context, decision, alternatives, consequences, status; one file in the existing numbering scheme.
5. **Keep docs honest about limits**: known issues, unsupported platforms, and anything NOT VERIFIED are stated, not omitted.
6. **Check links and build**: run the docs build/link check if the project has one; otherwise verify relative links exist with Glob.

## Rules

- Match the existing voice and structure; do not restyle unrelated sections.
- Do not document secrets, internal URLs, or credentials; use placeholders.
- Do not edit generated docs by hand; regenerate with the project's command.
- `CLAUDE.md` and agent instruction files are the user's; propose edits, do not apply them unless asked.

## Output

```
Docs updated: <files> (sections)
Verified commands: `<cmd>` -> <how verified>
Changelog: <entry or n/a>
Build/link check: <cmd> -> <result> | NOT VERIFIED (<why>)
Gaps left: ...
```

## Validation scenarios

- A README that says `npm test` while the lockfile is pnpm -> docs skill flags the conflict and uses the CONFIRMED command.
- Feature-level expectation with no changelog in the repo -> asks whether to add one rather than inventing a format.
