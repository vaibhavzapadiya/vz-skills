# Skill Design Contract

Every shipped skill must have a focused responsibility and pass this review.

## Required elements

- Supported file structure and metadata per current Claude Code docs.
- Clear name and description.
- Explicit use cases and non-use cases.
- Required inputs and context.
- Stepwise workflow with decision points.
- Expected output/artifacts.
- Repository preservation and safety constraints.
- Verification strategy and failure behavior.
- Examples or fixture scenarios that demonstrate value.
- No unsupported guarantees or unnecessary duplication.

## Design questions

1. What concrete problem does this skill solve?
2. Why is a separate skill better than shared guidance or a command?
3. What triggers it, and what prevents accidental over-triggering?
4. What context is necessary, and what should not be read?
5. What is the smallest complete workflow?
6. What evidence is needed before a claim can be made?
7. How does it behave when tools are missing or tests fail?
8. How can a developer customize it without forking the core?
9. Which scenario test proves the skill is useful?
10. Does the skill duplicate another capability?

## Quality gate

Reject a skill that is only a title plus generic advice, has no distinct scope, relies on fictional tools, assumes a stack without evidence, or reports work as verified without observing results.
