# Configuration and Profiles

## Design goals

- Useful defaults without mandatory setup.
- Explicit, validated user/project preferences.
- Clear precedence and errors.
- No silent safety downgrades.
- Stable configuration examples and migration guidance.
- Preferences never supersede platform permission or sandbox controls.

## Candidate profiles

| Profile | Intent | Typical behavior |
|---|---|---|
| FAST | Low ceremony | Concise plans, targeted checks, minimal reporting while retaining meaningful verification |
| BALANCED | Default | Plan and test in proportion to change risk; review material changes |
| PRODUCTION | High rigor | Explicit acceptance criteria, broader tests, security/release review when applicable |

Do not merely change labels or verbosity. Profiles must have observable, testable differences.

## Candidate preferences

- profile;
- planning depth;
- ambiguity/clarification threshold;
- test strategy;
- review depth;
- security review triggers;
- documentation expectations;
- coding conventions;
- hook enablement where safe;
- specialist delegation preference;
- approval boundaries for consequential actions;
- verification depth;
- final-report detail.

## Required specification

Document:
- schema and types;
- defaults;
- allowed values;
- precedence (platform, user, repository, task-specific) after verifying actual platform interactions;
- merge/override behavior;
- invalid/unknown key behavior;
- migration/versioning;
- examples;
- security-sensitive fields;
- tests.

Prefer explicit validation. Never silently accept a typo that changes safety-critical behavior. Unknown-key policy should be documented and tested.
