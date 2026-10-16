---
name: api-design
description: Design or change a public interface (HTTP/REST, GraphQL, gRPC, SDK, CLI, library API) with explicit contracts, versioning, backwards compatibility, error semantics, and contract tests. Use when adding or modifying endpoints, request/response shapes, public functions, or CLI flags that other code or clients depend on.
argument-hint: "[endpoint or interface]"
---

# API and interface design

An interface is a promise. Breaking it needs a version, a migration path, or an explicit decision by the user.

## Inputs

- Repository brief: API style in use (routes, OpenAPI/GraphQL schema files, protobufs, exported types), existing versioning scheme, error format, auth scheme, client code or SDKs in the repo, contract/snapshot tests.
- The behaviour the acceptance criteria require.

## Workflow

1. **Find the contract source of truth.** OpenAPI/Swagger file, GraphQL SDL, `.proto`, TypeScript `d.ts`/exports, CLI help text, or the handlers themselves. Changes must update that source, not just the implementation.
2. **Classify the change**: additive (new optional field/endpoint/flag), compatible change (widening accepted input, new enum value with defaults), or **breaking** (removing/renaming, changing types/semantics, tightening validation, changing default behaviour, changing error codes clients branch on).
3. **For breaking changes**: propose a versioned path (`/v2`, header, new function name), a deprecation window with warnings/logging, and a client migration note. Do not ship a silent break; if the user accepts a break, record it in the changelog and the report.
4. **Design the shape** consistently with the existing API: naming case, pagination style, filtering, sorting, timestamps (ISO 8601 UTC), IDs (opaque), nullability, envelope and error format, idempotency keys for non-idempotent writes, rate limits if the project has them.
5. **Errors**: use the project's error model; each failure mode maps to a status/code and a stable machine-readable identifier; messages never leak internals.
6. **Security**: authn/authz per endpoint stated explicitly; input limits (size, depth, array length); no mass assignment (explicit field allowlists).
7. **Contract tests**: request/response examples become tests (schema validation, snapshot of the contract file, SDK compile). Generated clients/docs are regenerated with the project's command, not edited by hand.
8. **Documentation**: update the contract file, reference docs, and the changelog per `documentation.expectation`.

## Output

```
Interface: <name>  Change class: additive | compatible | BREAKING
Contract source: <file>  Updated: yes/no
Shape: <summary of request/response or signature>
Compatibility: <impact on existing clients; version/deprecation plan>
Errors: <code -> meaning>
Security: <auth, limits>
Tests: <contract/snapshot/SDK tests and results>
Docs: <updated files>
```

## Validation scenarios

- Renaming a JSON field in a response -> classified BREAKING; plan keeps both fields for a deprecation window.
- New CLI flag with a default that preserves current behaviour -> additive; help text and docs updated in the same change.
