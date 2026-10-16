---
name: database
description: Database and schema change workflow: migrations that are reversible and backwards compatible, data backfills, index and query review, and safety around destructive operations, using the project's migration tool. Use when a change adds or alters tables, columns, indexes, constraints, or queries.
argument-hint: "[table, migration, or query]"
---

# Database and schema changes

Schema changes are **high** risk by default: they are hard to undo and affect running systems.

## Inputs

- Repository brief: ORM/migration tool (Prisma, Knex, TypeORM, Alembic, Django migrations, EF Core, Flyway, Liquibase, Rails, goose, ...), database engine, existing migration naming and location, seed/fixture conventions.
- The data model change required by the acceptance criteria.

## Workflow

1. **Inspect the current schema** from migrations/models, not from assumptions. Identify the tables, constraints, and indexes involved, and every query/code path that touches them (Grep for table/model names).
2. **Design for compatibility.** Prefer expand/contract: add nullable columns or new tables first; backfill; switch code; only then add NOT NULL/drop old columns in a later migration. Call out any step that locks large tables and how the engine behaves (e.g. adding an index concurrently where supported).
3. **Write the migration with the project's tool**, following its naming, timestamping, and up/down conventions. Every migration has a down path or an explicit note why it is irreversible (data destruction), which must be approved by the user before it ships.
4. **Backfills** are separate, batched, idempotent, and resumable; never a single `UPDATE` over a huge table without a batch size and a stop condition.
5. **Indexes and queries**: for each new query, state the predicate columns and whether an index covers them; run `EXPLAIN`/`EXPLAIN ANALYZE` locally when a database is available, otherwise mark NOT VERIFIED.
6. **Tests**: migration applies on a fresh database and on a database with existing data (the project's test DB or an ephemeral one if the project supports it); model/repository tests for the new behaviour; a down-migration smoke test where the tool supports it.
7. **Destructive statements** (`DROP`, `TRUNCATE`, mass `DELETE`, type narrowing): never run against anything but a local/test database, and only with the user's explicit confirmation in this conversation. The command guard will ask; do not work around it.

## Rules

- Do not hand-edit generated migration files produced by the tool unless the project does so routinely.
- Do not change existing committed migrations; add a new one.
- Keep seeds and fixtures free of real personal data.
- Connection strings and credentials come from the project's config/env; never inline them.

## Output

```
Schema change: <tables/columns/indexes>  Risk: high
Compatibility plan: expand -> backfill -> switch -> contract (which steps are in this change)
Migration(s): <paths>  Reversible: yes | no (why; user approval: yes/no)
Queries affected: <list with index coverage>
Tests: <commands and results>  EXPLAIN: <result or NOT VERIFIED>
Rollout notes: locks, duration estimates if known, rollback steps
```

## Validation scenarios

- Adding a NOT NULL column to an existing table -> plan uses nullable + backfill + constraint in two migrations.
- A request to drop a column -> down path or explicit irreversibility, and the drop is scheduled after code stops reading it.
