---
name: adr
description: Create and maintain Architecture Decision Records in the repository's existing format and numbering: new, supersede or deprecate, and list. Use when a change makes a lasting technical decision, or when asked to record or review one.
argument-hint: "[new <title> | supersede <number> | list]"
---

# Architecture decision records

An ADR records why a decision was made, so the next person does not have to guess or repeat the debate. It is short and written when the decision is made, not afterwards from memory.

## When an ADR is worth writing

Write one for decisions that are hard to reverse or that other code will depend on: adopting or replacing a framework, library, or service; a data model, storage, or schema strategy; a public API, event, or file format; deployment or infrastructure topology; an authentication or authorization model; a pattern every module must follow. Do not write one for routine changes a code review covers.

## Find the existing convention

1. Look for an ADR directory: `.adr-dir` (adr-tools), `docs/adr/`, `docs/adrs/`, `docs/decisions/`, `doc/architecture/decisions/`, `adr/`, `architecture/decisions/`. Glob for files like `0001-*.md` or `ADR-001*.md`.
2. Learn the format from the two most recent records: numbering (zero padding, prefix), file name style, headings (Nygard: Context, Decision, Consequences; MADR: Context and Problem Statement, Considered Options, Decision Outcome, Consequences), status values, and whether there is an index file (`README.md`, `index.md`) that lists them.
3. No ADRs in the repository: propose `docs/adr/` with the Nygard format below and ask before creating it. Never start a second ADR location next to an existing one.

## Workflow: new

1. **Gather the facts** from this task: the problem, the constraints (from `clarify`), the options considered and why each was rejected (from `plan`), and evidence such as benchmarks or spike results. Facts you do not have are written as open questions, not invented.
2. **Number it** one above the highest existing number; never reuse or renumber.
3. **Write it** in the repository's format. Default (Nygard):

```markdown
# <NNNN>. <Decision in a few words>

Date: <YYYY-MM-DD>
Status: Proposed | Accepted

## Context
<the forces at play: requirements, constraints, what is true today; 3-8 sentences>

## Options considered
- <option>: <why it was or was not chosen>

## Decision
<what we will do, in active voice: "We will ...">

## Consequences
<what becomes easier, what becomes harder, follow-up work, risks; include the bad ones>
```

4. **Status**: `Proposed` until the user confirms the decision; `Accepted` only when they do.
5. **Index**: add a line to the index file if the repository keeps one.

## Workflow: supersede or deprecate

Records are never edited to change history. Write a new record for the new decision with "Supersedes <NNNN>", and change only the old record's status line to `Superseded by <MMMM>` (or `Deprecated`, with one sentence why). Update the index.

## Workflow: list

Print number, title, status, and date for every record, newest first, and flag records still `Proposed` for more than a few weeks.

## Rules

- One decision per record. Short is better: if it does not fit on one screen, the decision is probably two decisions.
- Link to code, issues, or other ADRs by relative path or URL; never paste secrets or internal credentials.
- Writes only inside the ADR directory, plus its index.

## Validation scenarios

- A repository with `docs/adr/0007-use-postgres.md` in MADR format: the new record is `0008-*.md` in MADR, not Nygard.
- No ADR directory: proposes `docs/adr/` and waits for a yes.
- Superseding 0003: new record says "Supersedes 0003"; 0003 changes only its status line.
