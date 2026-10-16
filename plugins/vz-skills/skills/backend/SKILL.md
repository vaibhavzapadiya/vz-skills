---
name: backend
description: Backend engineering checklist for services, handlers, jobs, and integrations: input validation, error handling, idempotency, transactions, observability, configuration, and tests within the discovered framework. Use inside plan/implement/review when the change touches server-side code.
argument-hint: "[service, handler, or job]"
---

# Backend engineering

A specialist overlay on the lifecycle. The discovered framework and existing modules define the idioms.

## Inputs

- Repository brief: language/framework (Express, Fastify, NestJS, Django, FastAPI, ASP.NET, Spring, Go, Rails, ...), test runner, how config and secrets are loaded, logging library, existing handler and service patterns (read one sibling end to end).
- Acceptance criteria and risk tier (auth, payments, data writes are **high**).

## Checklist

### Boundaries
- Validate and type every input at the edge with the project's schema/validation layer; reject unknown fields where the project does; never trust client-supplied IDs for authorization decisions.
- AuthN/AuthZ enforced in the same place the rest of the codebase does it (middleware/decorator/policy), not ad hoc inside the handler.
- Outputs: consistent envelope/status codes as the project uses; no stack traces or internal identifiers in client responses.

### Correctness
- Idempotency for retried operations (keys, upserts, dedupe) where callers can retry.
- Transactions wrap multi-step writes; partial failure leaves consistent state; long transactions avoided.
- Concurrency: shared state is guarded or avoided; background jobs are safe to run twice; timeouts and retry limits on outbound calls; circuit-breaking if the project has it.
- Time and money: UTC and explicit zones; integer minor units or decimal types, never floats for currency.

### Operability
- Structured logs at the right level with correlation IDs if present; never log secrets, tokens, or full request bodies with PII.
- Metrics/traces where the project instruments; health/readiness unaffected or updated.
- Configuration via the existing config module/env; new settings documented with defaults; feature flags if the project uses them for risky behaviour.

### Data access
- Use the existing repository/ORM/query layer; parameterized queries only; pagination for list endpoints; indexes considered for new filters (hand to `database`).

### API surface
- New or changed endpoints go through `api-design` for compatibility and contract updates.

### Tests
- Unit tests for business rules; integration tests for handlers with the project's harness (test DB/containers if already configured; otherwise mocked boundaries and a NOT VERIFIED note for integration).
- Error paths tested (validation failure, not found, forbidden, downstream failure).

## Verification commands

CONFIRMED test/lint/typecheck/build commands from discovery. Do not start external dependencies (databases, queues) unless the project's test setup already does so locally.

## Output

Fold into plan slices and review findings with checklist references and file paths.

## Validation scenarios

- New endpoint that writes two tables without a transaction -> finding with the transactional fix.
- Handler that logs the full request including an `Authorization` header -> security finding (high).
