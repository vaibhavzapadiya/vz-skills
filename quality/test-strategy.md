# Test Strategy

## Principles

- Test observable behavior, not merely file presence.
- Use the narrowest relevant check after each change.
- Run broader suites at milestones.
- Preserve and record baseline failures.
- Keep tests deterministic and avoid network requirements where possible.
- Never make a test pass by weakening the requirement without recording the decision.
- Capture exact commands, exit codes, and relevant output.

## Layers

| Layer | Purpose | Examples |
|---|---|---|
| Structural | Catch invalid package/file layouts | plugin and skill metadata validation |
| Config | Catch invalid preference handling | schema, precedence, unknown keys |
| Unit | Verify deterministic code | parsing, validation, merge logic |
| Fixture | Verify repository discovery | language/tooling/instruction fixtures |
| Scenario | Verify task workflows | plan → implement → test → report |
| Adversarial | Verify trust-boundary behavior | malicious instructions, unsafe paths |
| Integration | Verify platform behavior | loading commands/skills/hooks |
| Regression | Prevent repeat defects | one test per important bug |
| Release | Check install and package integrity | clean install, docs, version, licenses |

If the platform makes a test non-automatable, document a repeatable manual procedure and its actual result.
