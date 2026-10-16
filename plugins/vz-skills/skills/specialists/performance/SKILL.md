---
name: performance
description: Investigate and improve performance with measurements first: reproduce the slow path, profile or time it, find the dominant cost, change one thing, and re-measure. Use when something is slow, when asked to optimize, or when a change touches hot paths, queries, or caching.
argument-hint: "[symptom or code path]"
---

# Performance investigation

No optimization without a before/after measurement in the same environment.

## Inputs

- Symptom and scope (`$ARGUMENTS`): endpoint, job, function, build step, test suite.
- Repository brief: stack, runtime versions, benchmarks or perf tests if any (`Grep` for `bench`, `perf`, `k6`, `autocannon`, `pytest-benchmark`, `BenchmarkDotNet`).
- Profile: risk tier rules apply (caching with invalidation is **high**).

## Workflow

1. **Define the metric and budget.** Latency (p50/p95), throughput, memory, CPU, bundle size, build time, query count. Ask for the budget if none exists; otherwise state the one you will use.
2. **Reproduce and measure the baseline** with a repeatable command: the project's benchmark if present; otherwise a minimal timed script, `node --cpu-prof`, `python -m cProfile`, `dotnet-counters`/`dotnet-trace` if installed, `EXPLAIN ANALYZE` for queries, or request timing with a local load tool that is already installed. Run at least three times; report median and spread. Never install global tooling to do this without asking.
3. **Find the dominant cost.** Read the profile or timings; name the top function/query/IO with its share. Common culprits to check explicitly: N+1 queries, missing indexes, synchronous IO in loops, repeated parsing/serialization, unbounded collections, O(n^2) over large n, chatty network calls, missing pagination, cold caches, debug logging in hot paths.
4. **Change one thing.** Implement via `implement` with a test guarding behaviour. Prefer algorithmic or IO fixes over micro-optimizations. For caching: define key, TTL, invalidation, and the stale-read consequence before coding.
5. **Re-measure** with the identical command. Report before/after with units and variance. If the gain is within noise, say so and revert unless the change also improves clarity.
6. **Guard against regression**: add a benchmark or a cheap assertion (query count, payload size) where the project has a place for it; otherwise note NOT VERIFIED for future regressions.

## Rules

- Do not report "faster" without numbers from this session.
- Do not trade correctness, security, or readability for speed without saying so and getting agreement.
- Do not benchmark against production systems or external services without authorization.

## Output

```
Metric: <what/unit>  Budget: <value or none>
Baseline: `<cmd>` -> median X (runs: a, b, c)
Dominant cost: <where> (<share>) evidence: <profile/EXPLAIN excerpt>
Change: <one line>  Risk: <tier>
After: `<cmd>` -> median Y (runs ...)   Delta: ...
Regression guard: <test/bench or NOT VERIFIED>
Residual: <remaining hotspots / not measured>
```

## Validation scenarios

- A function doing a database call inside a loop -> finding names the N+1 with the query count before/after.
- No measurable difference after a change -> report says "within noise", change reverted or justified on other grounds.
