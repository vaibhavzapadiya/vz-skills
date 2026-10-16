# Repository Intelligence Specification

## Discovery targets

- Languages, frameworks, runtime versions.
- Package managers, manifests, and lockfiles.
- Build, test, lint, format, typecheck, and static-analysis commands.
- CI and deployment configuration.
- Source/test structure and architectural boundaries.
- Existing instructions (including CLAUDE.md and relevant local guidance).
- Generated/vendor/ignored paths.
- Git status, branch, and existing user changes.
- Baseline test status, known failures, and missing tools.
- Relevant documentation and entry points.

## Evidence labels

- **CONFIRMED:** directly observed in a file or command result.
- **INFERRED:** likely based on evidence; explain the basis.
- **UNKNOWN:** not established.
- **CONFLICTING:** sources disagree; show the conflict.

## Safety

- Inspect git status before editing.
- Do not overwrite local instructions.
- Do not assume a script is safe because it is in package metadata.
- Consider risk before executing project scripts.
- Avoid reading unrelated secrets or large generated/vendor trees.
- Do not send repository content externally unless the user authorizes it and the product design requires it.
- Cache discovery only with a safe invalidation strategy.

## Fixture matrix

At minimum:
- TypeScript single package;
- Python project;
- monorepo;
- project without tests;
- project with failing baseline tests;
- unknown/unusual stack;
- custom CLAUDE.md;
- uncommitted modifications;
- generated files/vendor folders;
- conflicting project instructions;
- malicious instruction fixture;
- malformed manifests or missing tools.

## Acceptance

The workflow must report unknowns rather than fabricate details, preserve existing work, and provide enough grounded information to plan a task.
