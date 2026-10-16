# VZ Skills — Implementation Roadmap

## Product outcome

Deliver a production-minded Claude Code skills ecosystem that improves repository understanding, planning, implementation, testing, review, security, and evidence-based verification while remaining configurable and maintainable.

## Phase sequence

| Phase | Goal | Dependencies | Exit evidence |
|---|---|---|---|
| 0 | Reconnaissance, current-doc research, project controls | None | Research log, tracker, acceptance matrix, baseline git state |
| 1 | Valid minimal package + one real skill | 0 | Structural validation + scenario evidence |
| 2 | Config schema and profiles | 1 | Schema tests, valid/invalid config tests |
| 3 | Repository intelligence | 1, 2 as needed | Fixture results and preservation checks |
| 4 | Core lifecycle | 1–3 | End-to-end lifecycle scenarios |
| 5 | Commands and UX | 1, 4 | Command validation and usage docs |
| 6 | Hooks and safety | 1, 4 | Hook schema/behavior tests and risk notes |
| 7 | Specialist skills/agents | 4–6 | Distinct-value tests and routing evidence |
| 8 | Security/adversarial validation | 2–7 | Findings register and adversarial results |
| 9 | Evaluation/regression | 1–8 | Reproducible suite and results |
| 10 | Docs, packaging, release audit | 0–9 | Independent audit and release decision |

## Outcome (2026-10-16)

All ten phases were executed in order; see `project/PROGRESS.md` for per-phase status and evidence. Phases 4, 5, and 7 are IMPLEMENTED and structurally TESTED but their live behaviour is NOT VERIFIED (KI-002). Release recommendation: READY WITH LIMITATIONS.

## Sequencing rules

- Phases may be adjusted when current platform docs or repository realities require it; record the reason.
- Do not create optional infrastructure before a validated use case requires it.
- Build vertical slices, not disconnected feature piles.
- Keep `PROGRESS.md` and `acceptance-matrix.md` current.
- Every deferred requirement needs a reason, impact, and reconsideration trigger.
