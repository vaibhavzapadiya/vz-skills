/**
 * Profile matrix. Source of truth: `node plugins/vz-skills/scripts/vz-config.js --profiles`
 * and docs/configuration.md. Values are copied verbatim.
 */
export type ProfileName = 'FAST' | 'BALANCED' | 'PRODUCTION';

export const profileNames: ProfileName[] = ['FAST', 'BALANCED', 'PRODUCTION'];

export type MatrixRow = { key: string; FAST: string; BALANCED: string; PRODUCTION: string; plain: string };

export const profileMatrix: MatrixRow[] = [
  { key: 'planning.depth', FAST: 'minimal', BALANCED: 'standard', PRODUCTION: 'detailed', plain: 'How much the plan explains' },
  { key: 'planning.plan_when', FAST: 'risk>=high', BALANCED: 'risk>=medium', PRODUCTION: 'always', plain: 'When a written plan is required' },
  { key: 'clarification.ambiguity_tolerance', FAST: 'high', BALANCED: 'medium', PRODUCTION: 'low', plain: 'How much ambiguity is assumed away' },
  { key: 'clarification.ask_before_implementing', FAST: 'auto', BALANCED: 'auto', PRODUCTION: 'always', plain: 'Wait for your go-ahead before coding' },
  { key: 'testing.strategy', FAST: 'targeted', BALANCED: 'affected', PRODUCTION: 'full', plain: 'Which tests run' },
  { key: 'testing.require_baseline', FAST: 'false', BALANCED: 'true', PRODUCTION: 'true', plain: 'Record failures before changing anything' },
  { key: 'testing.require_new_tests_for_new_behavior', FAST: 'false', BALANCED: 'true', PRODUCTION: 'true', plain: 'New behaviour needs a new test' },
  { key: 'testing.tdd', FAST: 'auto', BALANCED: 'auto', PRODUCTION: 'always', plain: 'Write the failing test first' },
  { key: 'review.depth', FAST: 'quick', BALANCED: 'standard', PRODUCTION: 'thorough', plain: 'Self-review depth' },
  { key: 'review.independent_reviewer', FAST: 'never', BALANCED: 'auto', PRODUCTION: 'always', plain: 'Fresh-context reviewer agent' },
  { key: 'security.review_trigger', FAST: 'sensitive-paths', BALANCED: 'material-changes', PRODUCTION: 'always', plain: 'When the security review runs' },
  { key: 'documentation.expectation', FAST: 'none', BALANCED: 'touched-files', PRODUCTION: 'feature-level', plain: 'Documentation to update' },
  { key: 'response.style', FAST: 'concise', BALANCED: 'standard', PRODUCTION: 'detailed', plain: 'How much the assistant says' },
  { key: 'response.final_report', FAST: 'summary', BALANCED: 'evidence-table', PRODUCTION: 'full', plain: 'Shape of the completion report' },
  { key: 'verification.depth', FAST: 'targeted', BALANCED: 'standard', PRODUCTION: 'exhaustive', plain: 'What verify re-runs' },
];

/** Rows shown in the README's shorter comparison; used on the landing page. */
export const profileHighlights: Array<{ label: string; FAST: string; BALANCED: string; PRODUCTION: string }> = [
  { label: 'Write a plan when risk is', FAST: 'high', BALANCED: 'medium or above', PRODUCTION: 'always' },
  { label: 'Tests to run', FAST: 'changed units', BALANCED: 'plus everything that imports them', PRODUCTION: 'whole suite + lint + typecheck' },
  { label: 'Baseline before changing', FAST: 'no', BALANCED: 'yes', PRODUCTION: 'yes' },
  { label: 'Self-review depth', FAST: 'quick', BALANCED: 'standard', PRODUCTION: 'thorough' },
  { label: 'Independent reviewer agent', FAST: 'never', BALANCED: 'medium/high risk', PRODUCTION: 'always' },
  { label: 'Security review', FAST: 'sensitive paths', BALANCED: 'material changes', PRODUCTION: 'every change' },
  { label: 'Final report', FAST: 'summary', BALANCED: 'evidence table', PRODUCTION: 'full' },
];
