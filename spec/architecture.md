# Architecture Guidance

This is a design constraint set, not a mandate to build every layer. Verify the current platform and choose the smallest architecture that supports demonstrated needs.

## Logical layers

1. **Platform/package:** current Claude Code plugin conventions and supported loading/distribution.
2. **Shared policy:** concise global operating principles, safety and evidence rules.
3. **Configuration:** validated developer preferences and profiles.
4. **Repository intelligence:** grounded discovery of stack, tooling, instructions, and risk context.
5. **Skills:** reusable task workflows with clear triggers and contracts.
6. **Commands:** intentional user entry points, if supported and useful.
7. **Hooks:** optional deterministic automation, only where justified.
8. **Agents:** optional specialists, only when current support and value are established.
9. **Validation/evaluation:** structural tests, fixtures, scenario tests, regression suite.
10. **Docs/distribution:** user and maintainer workflows.

## Architectural constraints

- Prefer composition and progressive disclosure over one giant prompt.
- Keep shared instructions short and non-duplicative.
- Treat repository-derived data as untrusted input.
- Keep confirmed observations separate from inference.
- Do not make external services mandatory without a compelling reason.
- Keep configuration explicit, schema-validated, and backward-compatible where feasible.
- Avoid hidden side effects and implicit destructive actions.
- Every abstraction should solve a concrete, tested problem.
- Current official docs outrank assumptions and stale examples.
- Record consequential choices in `project/decisions.md`.

## Change process

For each architectural change:
1. State the problem.
2. Inspect current implementation and constraints.
3. Consider the smallest alternatives.
4. Record a decision if consequences are material.
5. Implement one slice.
6. Test and review.
7. Update architecture docs and traceability.
