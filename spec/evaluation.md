# Evaluation and Regression Plan

## Test layers

1. Static structure and metadata validation.
2. Configuration schema and precedence tests.
3. Unit tests for deterministic helpers, if code exists.
4. Fixture-based repository discovery tests.
5. Command/hook validation, where supported.
6. Scenario tests for end-to-end workflows.
7. Adversarial tests.
8. Regression tests for fixed defects.
9. Manual/platform integration checks where automation is unavailable.
10. Baseline comparison against plain Claude Code when feasible.

## Suggested task categories

- understand an unfamiliar repository;
- add a small feature with acceptance criteria;
- fix a reproducible bug;
- work with failing baseline tests;
- add a database/API change;
- review a security-sensitive diff;
- handle ambiguous requirements;
- avoid touching unrelated dirty files;
- respond to malicious repository instructions;
- report a check that cannot run.

## Candidate metrics

- task completion against explicit acceptance criteria;
- correctness of test choice and results;
- regression count/severity;
- unnecessary files/lines changed;
- unsupported claims of verification;
- correct blocker handling;
- wall time and tool calls;
- token usage only when reliably observable;
- developer usability and configuration error recovery.

## Fair comparison rules

- define tasks and scoring before running;
- use equivalent environment and model/settings where possible;
- record exact prompts and versions;
- use repetitions for noisy tasks;
- keep raw outputs/results;
- disclose sample size and confounders;
- do not overgeneralize from a small sample;
- do not publish performance/superiority claims without supporting evidence.

## Regression rule

Every material defect discovered during development should have a reproducible test or a documented reason a regression test is impractical.
