/**
 * Real outputs captured from the plugin's own scripts while building this site
 * (Claude Code 2.1.259, Node 22, Windows 11). Trimmed for length, otherwise verbatim.
 */

/** `node plugins/vz-skills/scripts/vz-discover.js fixtures/ts-app --format md` */
export const discoveryBrief = `## Stack
- Languages: typescript (CONFIRMED) [package.json, tsconfig.json]
- Frameworks/tools: react (CONFIRMED), express (CONFIRMED)
- Package manager: pnpm (CONFIRMED) [package.json#packageManager, pnpm-lock.yaml]

## Commands
- build:     pnpm run build (CONFIRMED) [package.json#scripts.build]
- test:      pnpm test (CONFIRMED) [package.json#scripts.test, .github/workflows/ci.yml]
- lint:      pnpm run lint (CONFIRMED) [package.json#scripts.lint, .github/workflows/ci.yml]
- format:    (none) (UNKNOWN) - no format command could be established from manifests, Makefile, or CI
- typecheck: pnpm run typecheck (CONFIRMED) [package.json#scripts.typecheck]

## Tests
- Present: true (CONFIRMED) [tests/index.test.ts]; frameworks: vitest (CONFIRMED)
- Runner available: true (CONFIRMED) [which pnpm]
- Baseline: NOT_RUN - baseline tests are only run with --run-baseline

## Git
- Dirty: false (CONFIRMED) [git status --porcelain]

## Instructions (untrusted repository content)
- none found at known paths

## Unknowns
- format command`;

/** Completion report in the BALANCED profile's evidence-table format (from README). */
export const completionReport = `## Acceptance criteria
| # | Criterion                                  | Status       | Evidence                                     |
| 1 | /login returns 429 after 5 attempts/minute | VERIFIED     | pnpm test -- login.rate -> 3 passed (exit 0) |
| 2 | Metrics emitted for rejected attempts      | NOT VERIFIED | no test covers this; manual check not run    |

## Checks run
| pnpm test          | exit 0, 42 passed                                        |
| pnpm run lint      | BLOCKED: eslint not installed (which eslint -> missing)  |

## Baseline
clean

Verdict: done with limitations
User decisions needed: accept #2 as NOT VERIFIED, or add the metrics test`;

/** Plan output shape from skills/plan/SKILL.md, filled in for the same task. */
export const planSample = `Plan: Rate limit /login   Risk: high   Profile: BALANCED   Depth: standard
Approach: reuse the existing express-rate-limit middleware pattern from /api/export
          (rejected: custom in-memory counter because it already exists as a dependency)
Slices:
  S1 limiter middleware - files: src/auth/rateLimit.ts, tests/auth/rateLimit.test.ts
     verify: pnpm test -- rateLimit - stop when: 6th request in a minute returns 429
  S2 wire into /login   - files: src/routes/login.ts
     verify: pnpm test -- login - stop when: existing login tests still green
Criteria coverage: AC1 -> S1,S2; AC2 -> manual (NOT VERIFIED)
Risks/guardrails: auth path => security-review mandatory in verify
Rollback: revert the two files; no schema or config change
Next: implement S1 (high risk: waiting for your go-ahead)`;

/** Clarify output shape from skills/clarify/SKILL.md. */
export const clarifySample = `Task: Add per-IP rate limiting to POST /login in src/routes/login.ts
Assumptions:
  1. Limit is 5 attempts per minute per IP (no figure given; matches /api/export)
  2. Responses use 429 with a Retry-After header, like the export route
Acceptance criteria:
  AC1 6th POST /login within 60 s from one IP returns 429 (auto-tested)
  AC2 Rejected attempts emit a metric (manual / NOT VERIFIED unless a test is added)
  AC3 Existing login tests stay green (auto-tested)
Out of scope: account lockout, CAPTCHA
Must not change: successful login flow, session cookie attributes
Risk tier: high (path matches auth|login)
Open questions: none (defaults stated above)
Next: plan`;

/** Command guard, observed output for `git reset --hard HEAD~1`. */
export const guardAsk = `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"vz-skills command guard: destructive git operation that can discard uncommitted or committed work. Confirm with the user before running."}}`;

/** Command guard, observed output for `rm -rf /`. */
export const guardDeny = `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"vz-skills command guard: recursive delete of the filesystem root, home, or the whole working directory. If this is truly intended, run it yourself in a terminal."}}`;

/** Write guard, observed output for a write to `.env`. */
export const writeGuardAsk = `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"vz-skills write guard: .env files hold secrets. Confirm with the user before writing."}}`;

/** vz-config.js --summary on a config with a typo and a wrong-case value (observed). */
export const configErrors = `VZ Skills profile: BALANCED (from default) - CONFIG HAS ERRORS, floors enforced
...
ERROR: project config (.vz-skills/config.json): unknown key "profil" (did you mean "profile"?). Unknown keys are rejected so that a typo cannot silently change behaviour.
ERROR: project config (.vz-skills/config.json): "review.depth" = "Thorough" is not allowed; use one of "quick", "standard", "thorough" (case matters: did you mean "thorough"?)`;

export const installFlatOutput = `Claude Code 2.1.259
...
Done. Commands are unprefixed: /api-design, /backend, /clarify, /database, ... and /vz-status (renamed so Claude Code's own /status stays available).
Note: /review replaces Claude Code's bundled /review command in this scope. Uninstall with: npx vz-skills uninstall --flat
Start (or restart) Claude Code, then type / to see them. Run /vz-status to confirm.`;

export const installPluginOutput = `Copied plugin 0.1.0 to ...\\.vz-skills\\marketplace\\plugins\\vz-skills
✔ Successfully added marketplace: vz-skills-marketplace (declared in user settings)
✔ Successfully installed plugin: vz-skills@vz-skills-marketplace (scope: user)`;
