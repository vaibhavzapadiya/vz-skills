# Command UX Specification

Candidate commands to evaluate against current official docs:
- setup
- status
- discover
- spec
- plan
- build
- test
- debug
- review
- security
- verify
- ship
- validate

These are not a requirement to create every command. Confirm current syntax, namespace behavior, discovery/loading, argument format, and documentation before implementation.

## Command quality requirements

- One obvious purpose.
- Useful description and argument contract.
- Clear prerequisites and outputs.
- Helpful errors and recovery instructions.
- Reuse skills rather than copy workflows.
- Respect configuration and repository conventions.
- Avoid hidden destructive side effects.
- Explain blocked checks and preserve evidence.
- Tests or documented manual validation for each shipped command.

## Command review

Before adding a command, ask:
1. Is it materially useful as a direct entry point?
2. Does native Claude Code already offer this capability?
3. Can a skill or existing command handle it?
4. Does it create a stable user-facing contract worth maintaining?
5. How will it be tested and documented?
