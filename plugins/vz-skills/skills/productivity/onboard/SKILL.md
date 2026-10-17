---
name: onboard
description: Write a one-page onboarding guide from the repository's real state: how to install, run, and test it, the code map, the main flows with file:line, conventions, and where to start. Use to onboard a developer or when a repository lacks a getting-started guide.
argument-hint: "[audience or focus, e.g. backend, new hire]"
---

# Onboarding guide

A new developer should be able to run the project and find their way in an hour. Every command in the guide is one discovery confirmed; every claim points at a file.

## Inputs

- `/vz-skills:discover` output (run it if there is none this session): stack, CONFIRMED commands, tests, CI, layout, instruction files.
- Existing docs (README, CONTRIBUTING, docs/, ADRs) so the guide links to them instead of repeating them.
- `$ARGUMENTS`: audience or focus (default: a competent developer new to this repository).

## Workflow

1. **Read before writing**: the README, the entry points discovery found, the main router or command dispatcher, and one test file. Stop expanding when you can explain the main flows; say what you did not read.
2. **Write the guide** in this order, one page (about 80-120 lines):
   - **What it is**: two sentences, in the repository's own vocabulary.
   - **Set up and run**: prerequisites with versions from the manifests, install, run, and test commands, each with its evidence label. UNKNOWN commands are listed as unknown, not guessed.
   - **Map**: the top-level folders and what lives where (a short table).
   - **How a request flows**: the two or three most important paths (for example a web request, a background job, a CLI command), each as 3-6 steps with `path:line`.
   - **Conventions**: naming, error handling, test style, commit style, from the code or the config's `conventions.notes`, with an example file for each.
   - **Where to start**: three small, real first tasks or files to read, and who or what to ask (links to CONTRIBUTING, ADRs, issue templates).
   - **Gotchas**: things that surprised you while reading (generated code, required services, environment variables by name only).
3. **Deliver**: print the guide. Write it to `docs/ONBOARDING.md` (or the location the user names) only when they ask; if the file exists, show a diff of your changes and ask before replacing it.

## Rules

- Never include secret values or internal URLs from config files; name the variable, not its value.
- Do not invent architecture: anything you infer is marked "inferred" with the reason.
- Link to existing docs rather than copying them.

## Validation scenarios

- A repository whose README says `npm test` while discovery CONFIRMED `pnpm test`: the guide uses `pnpm test` and notes the README conflict.
- No tests in the repository: the guide says so plainly under "Set up and run".
