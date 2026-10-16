# Product Vision

## Problem

Developers often use coding agents across unfamiliar repositories, ambiguous requirements, incomplete tests, and different risk levels. Static instructions alone may be too generic, too verbose, difficult to maintain, or insufficiently grounded in the actual project.

## Vision

VZ Skills is a configurable Claude Code skills ecosystem that makes repository work more systematic without replacing developer judgment or native platform controls.

## Primary users

- Individual developers working across multiple repositories.
- Teams with established conventions and quality expectations.
- Maintainers who need consistent planning, testing, review, and release workflows.
- Developers who want low-friction defaults but deeper rigor for production-sensitive work.

## Product outcomes

- Faster and more accurate repository orientation.
- Clearer requirements and acceptance criteria.
- Smaller, safer implementation steps.
- Appropriate test selection and honest reporting.
- Better reviews and risk-aware security checks.
- Developer-configurable workflow rigor.
- Reproducible evidence about what was actually checked.

## Non-goals for v1

- Supporting runtimes other than Claude Code.
- Replacing native permissions, sandboxing, or user approval.
- Guaranteeing defect-free or secure software.
- Claiming universal performance improvements without reproducible evaluation.
- Building a complex agent orchestration framework without evidence of need.
- Automatically executing arbitrary repository scripts without considering risk.

## Success measures

Choose metrics before measuring. Candidate measures:
- acceptance criteria met;
- successful completion of representative tasks;
- test selection correctness and observed test outcomes;
- regression rate;
- unnecessary file changes;
- unsupported verification claims;
- time/tool/token usage where observable;
- user configuration errors and recovery clarity.

Any reported comparison must include methodology, sample size, environment, and limitations.
