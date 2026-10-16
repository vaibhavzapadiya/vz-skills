# Hooks and Specialist Agents

## Hooks

Use hooks only after confirming current official schema, event names, input/output contracts, timeouts, and failure behavior.

Preferred traits:
- deterministic;
- quick;
- local where possible;
- idempotent;
- observable;
- easy to disable safely;
- narrowly scoped.

Test normal operation, malformed input, missing dependencies, errors, timeout behavior, repeated invocation, and failure modes where applicable.

Never claim a hook alone enforces a complete security boundary. Never use a hook to secretly exfiltrate content, bypass permissions, or run untrusted code without appropriate safeguards.

## Specialist agents

Possible roles:
- repository analyst;
- test strategist;
- security reviewer;
- performance investigator;
- documentation/release reviewer.

Only implement a role if current Claude Code support is verified and it has a clear benefit over a single workflow. Specify scope, expected inputs/output, limitations, tool restrictions if supported, and handoff format.

Avoid:
- redundant agents with overlapping roles;
- delegation for trivial work;
- excessive fan-out;
- invented configuration fields or unsupported tool restrictions;
- treating a second model opinion as proof.
