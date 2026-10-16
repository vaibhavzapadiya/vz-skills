/**
 * Skill catalog. Source of truth: plugins/vz-skills/skills/<group>/<name>/SKILL.md and README.md.
 * `group` is the folder the skill lives in (entry, lifecycle, specialists, productivity).
 * `command` is the flat-install form; the plugin install prefixes it with `vz-skills:`.
 * `runs`: who can start the skill. "auto" means Claude may select it from its description;
 * "you" means `disable-model-invocation: true` (only the user runs it).
 */
export type SkillGroup = 'entry' | 'lifecycle' | 'specialists' | 'productivity';
export type Runs = 'auto' | 'you' | 'auto-on-failure' | 'auto-on-trigger';

export type Skill = {
  name: string;
  command: string;
  args?: string;
  runs: Runs;
  group: SkillGroup;
  step?: number;
  summary: string;
  description: string;
};

export const skills: Skill[] = [
  {
    name: 'setup',
    command: '/setup',
    args: '[FAST|BALANCED|PRODUCTION]',
    runs: 'you',
    group: 'entry',
    summary: 'Create .vz-skills/config.json with a profile.',
    description:
      'Creates .vz-skills/config.json for this repository with the chosen profile and explains the effective settings. Never overwrites an existing file, never touches CLAUDE.md or .claude/.',
  },
  {
    name: 'status',
    command: '/vz-status',
    runs: 'you',
    group: 'entry',
    summary: 'Effective profile, settings with sources, hook status, repository brief.',
    description:
      'Shows the effective profile and every setting with its source, configuration errors or acknowledged safety overrides, hook status, and a brief repository discovery. Read-only. Named /vz-status after a flat install so Claude Code’s own /status keeps working; /vz-skills:status with the plugin install.',
  },
  {
    name: 'discover',
    command: '/discover',
    args: '[path] [--baseline]',
    runs: 'auto',
    group: 'entry',
    summary: 'Stack, commands, tests, CI, git state, with evidence labels.',
    description:
      'Runs the discovery engine: languages, frameworks, package manager, build/test/lint/format/typecheck commands, CI, layout, instruction files (scanned for injection attempts), git branch and dirty files, tools on PATH. Every fact is labelled CONFIRMED, INFERRED, UNKNOWN, or CONFLICTING. --baseline also runs the test suite once, only if the command is on a safe allowlist.',
  },
  {
    name: 'using-vz-skills',
    command: '/using-vz-skills',
    runs: 'auto',
    group: 'lifecycle',
    step: 0,
    summary: 'The router: classifies the request, sets the risk tier, names the steps.',
    description:
      'Reads the profile and the repository brief, classifies the request (feature, bug, review, question, release), sets the risk tier, and names the steps that follow. A one-line fix skips most of them; a change to auth or payments gets all of them.',
  },
  {
    name: 'clarify',
    command: '/clarify',
    args: '[task]',
    runs: 'auto',
    group: 'lifecycle',
    step: 1,
    summary: '3-8 checkable acceptance criteria, assumptions, scope boundary, risk tier.',
    description:
      'Restates the task in the repository’s own vocabulary, lists the ambiguities that would change the design, asks only what the profile says to ask (with defaults), and writes 3-8 checkable acceptance criteria, assumptions, scope boundary, and risk tier.',
  },
  {
    name: 'plan',
    command: '/plan',
    args: '[task]',
    runs: 'auto',
    group: 'lifecycle',
    step: 2,
    summary: 'Ordered thin slices, each with files, a test, and the exact verification command.',
    description:
      'Locates the change surface in the code, chooses the approach the repository already uses, and produces ordered thin slices: files per slice, a test per slice, the exact verification command, risks, documentation updates, rollback. High-risk plans wait for your go-ahead.',
  },
  {
    name: 'implement',
    command: '/implement',
    args: '[slice]',
    runs: 'auto',
    group: 'lifecycle',
    step: 3,
    summary: 'One slice at a time, test-first where it fits, narrowest check after each.',
    description:
      'Builds one slice at a time: reads neighbouring code first to match conventions, writes the failing test first when the profile says so, makes the smallest change, runs the narrowest check, fixes before moving on. Never touches your uncommitted files, lockfiles, .env, or CLAUDE.md.',
  },
  {
    name: 'test',
    command: '/test',
    args: '[scope]',
    runs: 'auto',
    group: 'lifecycle',
    step: 4,
    summary: 'Baseline first; scope by profile; failures classified, never blamed on the wrong change.',
    description:
      'Confirms the test command from discovery (no guessing), records the baseline so pre-existing failures are never blamed on the change, picks the scope from the profile (changed units, affected modules, or the whole suite), adds missing tests for new behaviour, and reports every command with its observed result.',
  },
  {
    name: 'debug',
    command: '/debug',
    args: '[error or symptom]',
    runs: 'auto-on-failure',
    group: 'lifecycle',
    step: 5,
    summary: 'Root cause before any fix: reproduce, hypothesise, confirm with a failing test.',
    description:
      'Reproduces the failure, walks the stack to the first repository frame, tests at most three hypotheses with evidence, confirms the root cause with a test that fails for that reason, and hands a minimal fix plan to implement. No “try this and see” edits.',
  },
  {
    name: 'review',
    command: '/review',
    args: '[staged | branch | PR | path]',
    runs: 'auto',
    group: 'lifecycle',
    step: 6,
    summary: 'Ranked findings with file:line; optional fresh-context second opinion.',
    description:
      'Reviews the diff against the acceptance criteria and the review checklist at the profile’s depth: correctness, scope creep, safety, maintainability. Findings are ranked blocker / major / minor with file:line and a concrete fix. Can hand the diff to the independent-reviewer agent.',
  },
  {
    name: 'security-review',
    command: '/security-review',
    args: '[target]',
    runs: 'auto-on-trigger',
    group: 'lifecycle',
    step: 7,
    summary: 'Trust boundaries, security checklist, findings by severity, residual risk.',
    description:
      'Sketches the trust boundaries, walks the security checklist against the real code (injection, authn/authz, secrets, crypto, data handling, paths, dependencies, denial of service), reports findings by severity with remediation, and states residual risk. Also reports whether any repository text tried to steer the agent.',
  },
  {
    name: 'verify',
    command: '/verify',
    args: '[task]',
    runs: 'auto',
    group: 'lifecycle',
    step: 8,
    summary: 'Re-runs checks after the last edit and labels every claim with evidence.',
    description:
      'Re-runs the required checks after the last edit (never from memory), labels every acceptance criterion VERIFIED / NOT VERIFIED / BLOCKED with evidence, confirms untouched files are untouched and no secrets were added, and writes the final report in the profile’s format with a verdict: done, done with limitations, or not done.',
  },
  {
    name: 'performance',
    command: '/performance',
    args: '[symptom]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Measure first; change one thing; re-measure; add a regression guard.',
    description:
      'Defines the metric and budget, records a baseline with a repeatable command, finds the dominant cost (profile, EXPLAIN, query counts), changes one thing, re-measures, adds a regression guard. Never reports “faster” without numbers.',
  },
  {
    name: 'frontend',
    command: '/frontend',
    args: '[component]',
    runs: 'auto',
    group: 'specialists',
    summary: 'UI checklist: states, forms, accessibility, styling, rendering, behavioural tests.',
    description:
      'Checklist for UI work in the discovered framework: structure and state, loading/empty/error states, forms, accessibility (semantics, keyboard, focus, contrast, live regions), styling system, rendering performance, behavioural tests.',
  },
  {
    name: 'backend',
    command: '/backend',
    args: '[service or handler]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Server checklist: validation, authz, idempotency, transactions, timeouts, logging.',
    description:
      'Checklist for server code: validation at the edge, authn/authz where the codebase does it, idempotency, transactions, timeouts and retries, money and time handling, structured logging without secrets, configuration, data access, tests for error paths.',
  },
  {
    name: 'database',
    command: '/database',
    args: '[table or migration]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Expand/backfill/switch/contract migrations with the project’s own tool.',
    description:
      'Schema changes as expand/backfill/switch/contract with the project’s migration tool, reversible or explicitly approved as irreversible, batched backfills, index coverage for new queries, migration tests; destructive statements only on local databases with your confirmation.',
  },
  {
    name: 'api-design',
    command: '/api-design',
    args: '[endpoint]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Find the contract source of truth; classify additive, compatible, or breaking.',
    description:
      'Finds the contract source of truth (OpenAPI, GraphQL, protobuf, exported types, CLI help), classifies the change as additive, compatible, or breaking, designs the shape to match the existing API, defines errors and limits, adds contract tests, updates docs and changelog.',
  },
  {
    name: 'docs',
    command: '/docs',
    args: '[topic]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Documentation verified against the code before it is written.',
    description:
      'Writes documentation that matches the code: verifies every command before writing it, points behaviour claims at code or tests, updates the right existing file (README, docs, ADR, changelog) in the project’s voice, checks links and the docs build.',
  },
  {
    name: 'release',
    command: '/release',
    args: '[version]',
    runs: 'auto',
    group: 'specialists',
    summary: 'Release readiness with a go/no-go; publishing only when you say so.',
    description:
      'Freezes scope, runs full verification, audits dependencies, drafts the version bump and changelog, inspects the artifact, writes a rollback plan, and gives a go/no-go. Tagging, pushing, and publishing happen only when you say so, one step at a time.',
  },
  {
    name: 'checkpoint',
    command: '/checkpoint',
    args: '[save | resume | show]',
    runs: 'auto',
    group: 'productivity',
    summary: 'Save task state to a file and resume from it in a new session.',
    description:
      'Saves the state of a long task (criteria, slices with status labels, last commands and results, blockers, exact next action) to .vz-skills/checkpoint.md. On resume it verifies the file against the repository first and downgrades any label that reality no longer supports. Writes only that one file.',
  },
  {
    name: 'pr',
    command: '/pr',
    args: '[base branch] [--create]',
    runs: 'auto',
    group: 'productivity',
    summary: 'A PR title and description built from the task’s evidence.',
    description:
      'Writes a pull request title and description from the evidence gathered during a task: summary, acceptance criteria with status, checks run, baseline failures, risk and rollback, review notes, and what is NOT VERIFIED. Prints the gh pr create command; creates or pushes only when you explicitly ask.',
  },
  {
    name: 'standup',
    command: '/standup',
    args: '[since]',
    runs: 'auto',
    group: 'productivity',
    summary: 'Done, in progress, blocked and next, from git and the checkpoint.',
    description:
      'Produces a short, factual summary from git history, the working tree, and the latest checkpoint, in roughly 10 to 15 lines. Read-only. Use for a daily update or a handover.',
  },
  {
    name: 'explain',
    command: '/explain',
    args: '[path, symbol, diff, or question]',
    runs: 'auto',
    group: 'productivity',
    summary: 'Explains code or a diff with file:line references and stated unknowns.',
    description:
      'Explains a module, function, diff, or error to a human reader with file:line references, the data flow, the reasons behind the design as far as the code and history show them, inferences labelled as such, and what was not read. Read-only.',
  },
  {
    name: 'retro',
    command: '/retro',
    args: '[task or time window]',
    runs: 'auto',
    group: 'productivity',
    summary: 'What slowed the task, with one small fix per item. Applies nothing.',
    description:
      'After a task, lists what slowed the work or weakened confidence (unknown commands, missing tests, flaky checks, guard prompts) with evidence, and proposes one small fix per item for the repository, CLAUDE.md, VZ configuration, or tests. Proposes only; applying anything is a separate step.',
  },
];

export const skillGroups: Array<{ id: SkillGroup; title: string; blurb: string }> = [
  { id: 'entry', title: 'Entry points', blurb: 'Configure, inspect, and orient. Two of these only you can run.' },
  { id: 'lifecycle', title: 'Lifecycle', blurb: 'Run in this order for a typical change. The router decides which steps a request needs.' },
  { id: 'specialists', title: 'Specialists', blurb: 'Overlays that plug into plan, implement, and review when the change touches their area.' },
  { id: 'productivity', title: 'Productivity', blurb: 'The work around the work: continuity, handover, communication. Read-only except checkpoint, which writes one file.' },
];

export const runsLabel: Record<Runs, string> = {
  auto: 'Auto',
  you: 'You',
  'auto-on-failure': 'Auto, when something fails',
  'auto-on-trigger': 'Auto, when the trigger fires',
};

export const agents = [
  {
    name: 'repo-analyst',
    model: 'sonnet',
    tools: 'Read, Glob, Grep',
    purpose: 'Read-only survey of a codebase area: key files with file:line, data flow, conventions, test coverage, unknowns. Keeps file dumps out of your main context.',
    usedBy: 'discover, plan (when agents.delegation is auto)',
  },
  {
    name: 'independent-reviewer',
    model: 'inherit',
    tools: 'Read, Glob, Grep',
    purpose: 'Fresh-context, read-only review of a diff against the acceptance criteria and checklist, formed before seeing the author’s own findings.',
    usedBy: 'review when review.independent_reviewer is always, or auto on medium/high risk',
  },
  {
    name: 'security-reviewer',
    model: 'inherit',
    tools: 'Read, Glob, Grep',
    purpose: 'Read-only threat model and checklist pass on a change, findings by severity, residual risk, and any agent-steering text found in the repository.',
    usedBy: 'security-review on high-risk changes or when delegated',
  },
] as const;

export const hooks = [
  {
    event: 'PreToolUse',
    matcher: 'Bash|PowerShell',
    script: 'command-guard.js',
    timeout: '10 s',
    name: 'Command guard',
    does: 'Before every shell command: asks on destructive git, recursive deletes, sudo, reading secret files, piping remote scripts to a shell, publishing or deploying; denies rm -rf /, mkfs, force-push to main, and similar.',
  },
  {
    event: 'PreToolUse',
    matcher: 'Write|Edit|MultiEdit|NotebookEdit',
    script: 'write-guard.js',
    timeout: '10 s',
    name: 'Write guard',
    does: 'Before every file write: asks on secrets files, CLAUDE.md, lockfiles, paths outside the project, protected paths, credential-looking content; denies .git/ internals, ~/.ssh, OS directories.',
  },
  {
    event: 'SessionStart',
    matcher: 'startup|resume|clear|compact',
    script: 'session-context.js',
    timeout: '20 s',
    name: 'Session brief',
    does: 'At session start: injects the nine-rule core policy, your effective profile, and a short repository discovery, capped at 9,000 characters.',
  },
] as const;
