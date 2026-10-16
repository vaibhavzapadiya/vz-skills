# Requirements Traceability

Updated 2026-10-16. Paths are real; test identifiers refer to `tests/*.test.js` and `tracking/test-matrix.csv`.

| Requirement family | Spec location | Implementation location | Tests/scenarios | Acceptance IDs |
|---|---|---|---|---|
| Product identity and scope | `spec/product-vision.md` | `plugins/vz-skills/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `README.md` | `tests/structure.test.js`, `tests/platform.test.js` (TC-001) | REQ-001, REQ-002 |
| Configuration/profiles | `spec/configuration.md` | `plugins/vz-skills/scripts/lib/config.js`, `scripts/vz-config.js`, `docs/examples/*.json`, `docs/configuration.md` | `tests/config.test.js` (TC-002, TC-003, TC-013), `tests/docs.test.js` | REQ-004, REQ-005 |
| Repository intelligence | `spec/repository-intelligence.md` | `plugins/vz-skills/scripts/lib/discover.js`, `lib/fsutil.js`, `scripts/vz-discover.js`, `skills/discover/SKILL.md`, `agents/repo-analyst.md` | `tests/discovery.test.js` over `fixtures/*` (TC-004..TC-012, TC-015) | REQ-006, REQ-007 |
| Skills and lifecycle | `spec/skill-contract.md` | `plugins/vz-skills/skills/{using-vz-skills,clarify,plan,implement,test,debug,review,security-review,verify}/SKILL.md`, `references/*.md`, `policy/core-policy.md` | `tests/structure.test.js`, `scripts/vz-validate.js`, `evals/*` (TC-014, BLOCKED live) | REQ-003, REQ-008, REQ-013 |
| Commands | `spec/commands.md` | `skills/{setup,status,discover}` (user-run skills, DEC-006) | structure tests; script CLI tests in config/discovery suites; `plugin details` listing | REQ-009 |
| Hooks and agents | `spec/hooks-and-agents.md` | `plugins/vz-skills/hooks/hooks.json`, `scripts/hooks/*.js`, `scripts/lib/hookio.js`, `agents/*.md`, `docs/hooks.md`, `docs/agents.md` | `tests/hooks.test.js`; agent frontmatter in structure tests + official validator | REQ-010, REQ-011 |
| Security | `spec/security.md` | `docs/security.md`, guards, discovery injection scan, config floors, policy rule 4/5/7 | TC-012, TC-013, hook adversarial tests, config floor tests | REQ-012, REQ-013 |
| Evaluation | `spec/evaluation.md` | `tests/*.test.js`, `fixtures/`, `plugins/vz-skills/evals/`, `docs/testing-and-evaluation.md` | `npm test` (67); eval suite BLOCKED | REQ-014, REQ-015 |
| Distribution | `spec/distribution.md` | `docs/install.md`, `docs/contributing.md`, `scripts/package-release.js`, `CHANGELOG.md`, `quality/release-checklist.md`, `docs/release-audit.md` | `tests/platform.test.js` (TC-016 partial), `npm run package` | REQ-016, REQ-018, REQ-019 |
