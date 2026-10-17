---
name: retro
description: After a task, review what slowed the work or weakened confidence (unknown commands, missing tests, flaky checks, unclear conventions, blocked tools) and turn each into a concrete, small improvement to the repository or its VZ configuration, proposed but not applied. Use at the end of a task, after a painful debugging session, or when asked how to make the repo easier to work in.
argument-hint: "[task or time window]"
---

# Retrospective: make the next task easier

The output is a short list of improvements with evidence, each small enough to do in minutes. Nothing is changed by this skill.

## Inputs

- This conversation's history for the task: discovery report (UNKNOWNs, CONFLICTING facts, missing tools), checks that were BLOCKED, tests that were missing or flaky, questions that had to be asked, guard prompts visible in this conversation (do not estimate ones you did not see), review findings that recurred.
- The checkpoint and `verify` report if present; `git log` for the task's commits.
- Profile and `.vz-skills/config.json` (to suggest configuration changes rather than code changes where that is the right fix).

## Workflow

1. **Collect friction with evidence.** For each item note where it cost time or confidence: "test command UNKNOWN at discovery; found in CONTRIBUTING after 10 minutes", "AC3 NOT VERIFIED: no test harness for the API layer", "`npm test` flaky: 1 of 3 runs failed on `date.test.js`", "guard asked 4 times for `rm -rf dist`".
2. **Propose one fix per item**, the smallest that removes the friction, in one of these forms:
   - repository: add a `test`/`lint` script, a fixture, a `conftest`, a `.nvmrc`, a CI step, a `CONTRIBUTING` line;
   - instructions: a specific line for `CLAUDE.md` or `.claude/rules/` (quote the exact text to add; do not write it);
   - VZ configuration: a `conventions.notes` entry, `hooks.protected_paths`, a profile change, `approvals.run_project_scripts`;
   - tests: the regression test that would have caught the bug earlier (name the file and the case);
   - process: "run `discover --baseline` first next time".
3. **Rank** by expected payoff for the next task (recurring friction first), mark each as 5-minute, 30-minute, or longer.
4. **Note what went well** in one or two lines only if it should be kept deliberately (a convention worth writing down).

## Output

```
Retro - <task>
1. <friction> (evidence) -> <fix> [5 min | 30 min | longer] [repo | CLAUDE.md | vz config | test | process]
2. ...
Keep doing: ...
Offer: apply items 1-2 now? (each is a normal change through implement/docs with its own check)
```

## Safety

- Proposes only. Applying any item is a separate, explicit step through `implement` or `docs`, with the usual guards.
- Never suggests weakening a guard or a floor to "reduce friction"; suggests narrowing patterns or `protected_paths` instead.
- Does not include secrets or paste large logs; cites the command and the outcome.

## Failure behaviour

- Little history available (short task): say so and limit to the one or two observations that exist rather than inventing friction.
- Friction caused by a platform limitation (tool missing on the machine): say it is environmental and what to install.

## Validation scenarios

- Task where the test command was UNKNOWN and one criterion stayed NOT VERIFIED: items 1-2 are "add `scripts.test`" and "add a test for AC3 at <path>", both 5-30 minutes.
- Smooth task: output says there was no material friction and lists one convention worth recording.
