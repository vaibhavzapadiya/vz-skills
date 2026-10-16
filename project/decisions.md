# VZ Skills — Decision Log

Record consequential design decisions. Add new decisions at the top. Do not silently change an accepted decision; supersede it with a new entry and rationale.

## Decision template

### DEC-XXX — Short title

- **Status:** PROPOSED / ACCEPTED / REJECTED / SUPERSEDED
- **Date:**
- **Context:**
- **Decision:**
- **Alternatives considered:**
- **Evidence/source:**
- **Consequences/trade-offs:**
- **Follow-up/test required:**

## Initial decisions to verify

### DEC-001 — Claude Code is the only v1 runtime

- **Status:** ACCEPTED
- **Context:** Initial product scope.
- **Decision:** Build and validate for Claude Code only. Keep internal boundaries maintainable, but do not implement other runtimes.
- **Alternatives considered:** Multi-runtime from the start.
- **Consequences/trade-offs:** Faster validation and fewer compatibility branches; portability is not guaranteed.
- **Follow-up/test required:** Confirm all shipped structures and instructions match current Claude Code conventions.

### DEC-002 — BALANCED is the default profile

- **Status:** PROPOSED
- **Context:** Need useful defaults without mandatory configuration.
- **Decision:** Evaluate BALANCED as the default, with FAST and PRODUCTION options.
- **Alternatives considered:** No profiles; user-configured settings only.
- **Consequences/trade-offs:** Profiles improve usability but must avoid hidden complexity.
- **Follow-up/test required:** Implement only if profile behavior is concrete, documented, and testable.

### DEC-003 — Native platform permissions remain authoritative

- **Status:** ACCEPTED
- **Context:** Skills and hooks cannot be treated as complete security boundaries.
- **Decision:** Do not imply VZ configuration can override platform permissions or sandbox policy.
- **Alternatives considered:** Plugin-level approval framework that claims enforcement.
- **Consequences/trade-offs:** Safety messaging stays accurate; enforcement depends on supported native controls.
- **Follow-up/test required:** Audit docs and risky-action workflows.
