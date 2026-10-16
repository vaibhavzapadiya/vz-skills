'use strict';
/**
 * VZ Skills configuration: schema, defaults, profiles, precedence, validation.
 *
 * Precedence (lowest -> highest):
 *   built-in defaults < profile preset < user file (~/.vz-skills/config.json)
 *   < project file (<project>/.vz-skills/config.json) < VZ_SKILLS_PROFILE env (profile only)
 * The effective profile is chosen first (env > project > user > default), its preset is
 * applied, then explicit keys from user and project files override the preset.
 *
 * Safety: some keys have floors. Lowering them requires listing the key in
 * `safety.acknowledged_overrides`; the resolver then applies the value AND reports a
 * warning so the downgrade is never silent. Nothing here changes Claude Code's own
 * permissions or sandbox: this file is read only by VZ scripts and skills.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CONFIG_VERSION = 1;
const PROFILES = ['FAST', 'BALANCED', 'PRODUCTION'];

// key -> { type, values?, min?, max?, maxLength?, description, floor?: {order: [...lowest..highest], min: value, production_min?: value} }
const SCHEMA = {
  'version': { type: 'number', description: 'Config schema version. Only 1 is supported.' },
  'profile': { type: 'string', values: PROFILES, description: 'Rigor profile. Sets presets for every other key; explicit keys override presets.' },
  'planning.depth': { type: 'string', values: ['minimal', 'standard', 'detailed'], description: 'How much planning detail the plan skill produces.' },
  'planning.plan_when': { type: 'string', values: ['never', 'risk>=high', 'risk>=medium', 'risk>=low', 'always'], description: 'When a written plan is required before implementation, by change risk tier.', floor: { order: ['never', 'risk>=high', 'risk>=medium', 'risk>=low', 'always'], production_min: 'risk>=low' } },
  'clarification.ambiguity_tolerance': { type: 'string', values: ['low', 'medium', 'high'], description: 'low = ask about any ambiguity that changes the design; high = proceed on sensible assumptions and state them.' },
  'clarification.ask_before_implementing': { type: 'string', values: ['auto', 'always', 'never'], description: 'Whether acceptance criteria must be confirmed with the user before implementing.' },
  'testing.strategy': { type: 'string', values: ['targeted', 'affected', 'full'], description: 'targeted = tests for changed units; affected = plus tests that import them; full = whole suite.', floor: { order: ['targeted', 'affected', 'full'], production_min: 'affected' } },
  'testing.require_baseline': { type: 'boolean', description: 'Run (allowlisted) baseline tests before changing code so pre-existing failures are recorded.' },
  'testing.tdd': { type: 'string', values: ['auto', 'always', 'never'], description: 'Write the failing test first for new behaviour.' },
  'testing.require_new_tests_for_new_behavior': { type: 'boolean', description: 'New behaviour without a test is reported as NOT VERIFIED.' },
  'review.depth': { type: 'string', values: ['quick', 'standard', 'thorough'], description: 'Self-review depth before reporting completion.', floor: { order: ['quick', 'standard', 'thorough'], production_min: 'standard' } },
  'review.independent_reviewer': { type: 'string', values: ['auto', 'always', 'never'], description: 'Delegate a fresh-context review to the independent-reviewer agent.' },
  'security.review_trigger': { type: 'string', values: ['sensitive-paths', 'material-changes', 'always'], description: 'When the security-review skill runs.', floor: { order: ['sensitive-paths', 'material-changes', 'always'], min: 'sensitive-paths', production_min: 'material-changes' } },
  'security.threat_model_on_production': { type: 'boolean', description: 'Produce a short threat model for PRODUCTION-profile changes that touch trust boundaries.' },
  'documentation.expectation': { type: 'string', values: ['none', 'touched-files', 'feature-level'], description: 'What documentation must be updated with a change.' },
  'conventions.notes': { type: 'string', maxLength: 2000, description: 'Free-text team conventions passed to skills (style, naming, commit rules). Treated as instructions from the repo owner, not as code.' },
  'conventions.commit_style': { type: 'string', values: ['project', 'conventional', 'freeform'], description: 'Commit message style when the user asks for commits.' },
  'conventions.extra_instructions_file': { type: 'path', description: 'Optional Markdown file (inside the project) with extra conventions to read.' },
  'response.style': { type: 'string', values: ['concise', 'standard', 'detailed'], description: 'Verbosity of explanations.' },
  'response.final_report': { type: 'string', values: ['summary', 'evidence-table', 'full'], description: 'Shape of the completion report produced by the verify skill.', floor: { order: ['summary', 'evidence-table', 'full'], production_min: 'evidence-table' } },
  'hooks.command_guard': { type: 'string', values: ['on', 'off'], description: 'PreToolUse shell guard: asks before risky commands, denies catastrophic ones. Turning it off needs safety.acknowledged_overrides.', floor: { order: ['off', 'on'], min: 'on' } },
  'hooks.write_guard': { type: 'string', values: ['on', 'off'], description: 'PreToolUse write guard for sensitive paths and secret-like content. Turning it off needs safety.acknowledged_overrides.', floor: { order: ['off', 'on'], min: 'on' } },
  'hooks.session_context': { type: 'boolean', description: 'Inject profile and discovery brief at session start.' },
  'hooks.protected_paths': { type: 'string[]', maxItems: 50, description: 'Extra project-relative globs the write guard asks before touching (e.g. "migrations/**").' },
  'agents.delegation': { type: 'string', values: ['auto', 'minimal', 'never'], description: 'How readily skills delegate to the plugin subagents.' },
  'approvals.destructive_git': { type: 'string', values: ['ask', 'refuse'], description: 'Behaviour for reset/clean/force-push style operations: ask the user, or refuse outright. There is no "allow".' },
  'approvals.external_actions': { type: 'string', values: ['ask', 'refuse'], description: 'Behaviour for publishing, deploying, posting, sending.' },
  'approvals.run_project_scripts': { type: 'string', values: ['allowlist', 'ask', 'refuse'], description: 'allowlist = run only well-known test/build commands without asking; ask = confirm each; refuse = never run project scripts.' },
  'verification.depth': { type: 'string', values: ['targeted', 'standard', 'exhaustive'], description: 'How much re-verification happens before reporting done.', floor: { order: ['targeted', 'standard', 'exhaustive'], production_min: 'standard' } },
  'verification.require_evidence_labels': { type: 'boolean', description: 'Final reports must label claims IMPLEMENTED / TESTED / VERIFIED / BLOCKED / NOT VERIFIED. Turning it off needs safety.acknowledged_overrides.', floor: { order: [false, true], min: true } },
  'safety.acknowledged_overrides': { type: 'string[]', maxItems: 20, description: 'Keys whose safety floor you deliberately lower. Each is reported as a warning every time config is resolved.' },
};

const BASE_DEFAULTS = {
  version: 1,
  profile: 'BALANCED',
  conventions: { notes: '', commit_style: 'project', extra_instructions_file: '' },
  hooks: { command_guard: 'on', write_guard: 'on', session_context: true, protected_paths: [] },
  agents: { delegation: 'auto' },
  approvals: { destructive_git: 'ask', external_actions: 'ask', run_project_scripts: 'allowlist' },
  verification: { require_evidence_labels: true },
  safety: { acknowledged_overrides: [] },
  security: { threat_model_on_production: true },
  testing: { tdd: 'auto' },
};

const PROFILE_PRESETS = {
  FAST: {
    planning: { depth: 'minimal', plan_when: 'risk>=high' },
    clarification: { ambiguity_tolerance: 'high', ask_before_implementing: 'auto' },
    testing: { strategy: 'targeted', require_baseline: false, require_new_tests_for_new_behavior: false },
    review: { depth: 'quick', independent_reviewer: 'never' },
    security: { review_trigger: 'sensitive-paths' },
    documentation: { expectation: 'none' },
    response: { style: 'concise', final_report: 'summary' },
    verification: { depth: 'targeted' },
  },
  BALANCED: {
    planning: { depth: 'standard', plan_when: 'risk>=medium' },
    clarification: { ambiguity_tolerance: 'medium', ask_before_implementing: 'auto' },
    testing: { strategy: 'affected', require_baseline: true, require_new_tests_for_new_behavior: true },
    review: { depth: 'standard', independent_reviewer: 'auto' },
    security: { review_trigger: 'material-changes' },
    documentation: { expectation: 'touched-files' },
    response: { style: 'standard', final_report: 'evidence-table' },
    verification: { depth: 'standard' },
  },
  PRODUCTION: {
    planning: { depth: 'detailed', plan_when: 'always' },
    clarification: { ambiguity_tolerance: 'low', ask_before_implementing: 'always' },
    testing: { strategy: 'full', require_baseline: true, require_new_tests_for_new_behavior: true, tdd: 'always' },
    review: { depth: 'thorough', independent_reviewer: 'always' },
    security: { review_trigger: 'always' },
    documentation: { expectation: 'feature-level' },
    response: { style: 'detailed', final_report: 'full' },
    verification: { depth: 'exhaustive' },
  },
};

// ---------- utilities ----------
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out); else out[key] = v;
  }
  return out;
}
function setDeep(obj, key, value) {
  const parts = key.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) { cur[parts[i]] = cur[parts[i]] && typeof cur[parts[i]] === 'object' ? cur[parts[i]] : {}; cur = cur[parts[i]]; }
  cur[parts[parts.length - 1]] = value;
}
function getDeep(obj, key) { return key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), obj); }
function levenshtein(a, b) {
  const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function suggest(key) {
  let best = null, bestD = Infinity;
  for (const k of Object.keys(SCHEMA)) { const dd = levenshtein(key.toLowerCase(), k.toLowerCase()); if (dd < bestD) { bestD = dd; best = k; } }
  return bestD <= Math.max(3, Math.floor(key.length / 3)) ? best : null;
}
function rank(spec, value) { return spec.floor.order.findIndex((v) => v === value); }

// ---------- validation of one file's contents ----------
function validateDocument(doc, { source = 'config', projectRoot = null } = {}) {
  const errors = [];
  const warnings = [];
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    return { errors: [{ key: '(root)', message: `${source}: top level must be a JSON object` }], warnings, flat: {} };
  }
  const flat = flatten(doc);
  for (const [key, value] of Object.entries(flat)) {
    if (key === '$schema' || key === '$comment') continue;
    const spec = SCHEMA[key];
    if (!spec) {
      const s = suggest(key);
      errors.push({ key, message: `${source}: unknown key "${key}"${s ? ` (did you mean "${s}"?)` : ''}. Unknown keys are rejected so that a typo cannot silently change behaviour.` });
      continue;
    }
    const t = spec.type;
    if (t === 'string' && typeof value !== 'string') { errors.push({ key, message: `${source}: "${key}" must be a string${spec.values ? ` (one of ${spec.values.join(', ')})` : ''}; got ${JSON.stringify(value)}` }); continue; }
    if (t === 'boolean' && typeof value !== 'boolean') { errors.push({ key, message: `${source}: "${key}" must be true or false; got ${JSON.stringify(value)}` }); continue; }
    if (t === 'number' && typeof value !== 'number') { errors.push({ key, message: `${source}: "${key}" must be a number; got ${JSON.stringify(value)}` }); continue; }
    if (t === 'string[]') {
      if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) { errors.push({ key, message: `${source}: "${key}" must be an array of strings` }); continue; }
      if (spec.maxItems && value.length > spec.maxItems) errors.push({ key, message: `${source}: "${key}" has ${value.length} items; max ${spec.maxItems}` });
      if (key === 'safety.acknowledged_overrides') for (const v of value) if (!SCHEMA[v] || !SCHEMA[v].floor) errors.push({ key, message: `${source}: "${key}" lists "${v}", which is not a safety-floored key` });
      if (key === 'hooks.protected_paths') for (const v of value) if (v.includes('..') || path.isAbsolute(v)) errors.push({ key, message: `${source}: "${key}" entry "${v}" must be a project-relative glob without ".."` });
      continue;
    }
    if (t === 'path') {
      if (typeof value !== 'string') { errors.push({ key, message: `${source}: "${key}" must be a string path` }); continue; }
      if (value === '') continue;
      if (path.isAbsolute(value) || value.split(/[\\/]/).includes('..') || /^[A-Za-z]:/.test(value) || value.startsWith('~')) {
        errors.push({ key, message: `${source}: "${key}" must be a relative path inside the project without ".." (got "${value}")` });
        continue;
      }
      if (projectRoot) {
        const abs = path.resolve(projectRoot, value);
        const rel = path.relative(projectRoot, abs);
        if (rel.startsWith('..') || path.isAbsolute(rel)) errors.push({ key, message: `${source}: "${key}" resolves outside the project` });
        else if (!fs.existsSync(abs)) warnings.push({ key, message: `${source}: "${key}" points at a file that does not exist yet (${value})` });
      }
      continue;
    }
    if (spec.values && !spec.values.includes(value)) {
      const s = spec.values.find((v) => String(v).toLowerCase() === String(value).toLowerCase());
      errors.push({ key, message: `${source}: "${key}" = ${JSON.stringify(value)} is not allowed; use one of ${spec.values.map((v) => JSON.stringify(v)).join(', ')}${s !== undefined ? ` (case matters: did you mean ${JSON.stringify(s)}?)` : ''}` });
      continue;
    }
    if (spec.maxLength && String(value).length > spec.maxLength) errors.push({ key, message: `${source}: "${key}" is ${String(value).length} chars; max ${spec.maxLength}` });
  }
  if (flat.version !== undefined && flat.version !== CONFIG_VERSION) errors.push({ key: 'version', message: `${source}: version ${flat.version} is not supported (supported: ${CONFIG_VERSION}). See docs/configuration.md#migration.` });
  return { errors, warnings, flat };
}

// ---------- loading ----------
function loadFile(file, source, projectRoot) {
  if (!fs.existsSync(file)) return { present: false, doc: null, errors: [], warnings: [], flat: {} };
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { return { present: true, doc: null, errors: [{ key: '(file)', message: `${source}: cannot read ${file}: ${e.message}` }], warnings: [], flat: {} }; }
  let doc;
  try { doc = JSON.parse(text.replace(/^﻿/, '')); } catch (e) {
    return { present: true, doc: null, errors: [{ key: '(file)', message: `${source}: ${file} is not valid JSON (${e.message}). Fix the syntax; VZ Skills does not fall back to defaults silently when a config file is present but broken.` }], warnings: [], flat: {} };
  }
  const v = validateDocument(doc, { source, projectRoot });
  return { present: true, doc, errors: v.errors, warnings: v.warnings, flat: v.flat };
}

/**
 * Resolve the effective configuration.
 * @param {{projectRoot?: string, userConfigPath?: string|null, env?: object, extraDocs?: Array<{source:string, doc:object}>}} opts
 */
function resolveConfig(opts = {}) {
  const projectRoot = path.resolve(opts.projectRoot || process.cwd());
  const env = opts.env || process.env;
  const userPath = opts.userConfigPath === undefined ? path.join(os.homedir(), '.vz-skills', 'config.json') : opts.userConfigPath;
  const projectPath = path.join(projectRoot, '.vz-skills', 'config.json');
  const layers = [];
  if (userPath) layers.push({ name: 'user', file: userPath, ...loadFile(userPath, `user config (${userPath})`, null) });
  layers.push({ name: 'project', file: projectPath, ...loadFile(projectPath, `project config (.vz-skills/config.json)`, projectRoot) });
  for (const x of opts.extraDocs || []) { const v = validateDocument(x.doc, { source: x.source, projectRoot }); layers.push({ name: x.source, file: null, present: true, doc: x.doc, errors: v.errors, warnings: v.warnings, flat: v.flat }); }

  const errors = layers.flatMap((l) => l.errors);
  const warnings = layers.flatMap((l) => l.warnings);
  const sources = {};

  // 1. profile
  let profile = BASE_DEFAULTS.profile; sources.profile = 'default';
  for (const l of layers) if (l.flat.profile !== undefined) { profile = l.flat.profile; sources.profile = l.name; }
  if (env.VZ_SKILLS_PROFILE !== undefined && env.VZ_SKILLS_PROFILE !== '') {
    if (PROFILES.includes(env.VZ_SKILLS_PROFILE)) { profile = env.VZ_SKILLS_PROFILE; sources.profile = 'env:VZ_SKILLS_PROFILE'; }
    else errors.push({ key: 'profile', message: `VZ_SKILLS_PROFILE="${env.VZ_SKILLS_PROFILE}" is not one of ${PROFILES.join(', ')}` });
  }
  if (!PROFILES.includes(profile)) profile = 'BALANCED';

  // 2. base defaults + preset
  const effective = JSON.parse(JSON.stringify(BASE_DEFAULTS));
  for (const k of Object.keys(flatten(BASE_DEFAULTS))) if (k !== 'profile') sources[k] = 'default';
  for (const [k, v] of Object.entries(flatten(PROFILE_PRESETS[profile]))) { setDeep(effective, k, v); sources[k] = `profile:${profile}`; }
  effective.profile = profile;

  // 3. explicit overrides, later layers win
  const explicit = {};
  for (const l of layers) for (const [k, v] of Object.entries(l.flat)) {
    if (k === 'profile' || k === '$schema' || k === '$comment' || !SCHEMA[k]) continue;
    setDeep(effective, k, v); sources[k] = l.name; explicit[k] = { value: v, source: l.name };
  }

  // 4. floors and profile conflicts
  const acknowledged = new Set(effective.safety.acknowledged_overrides || []);
  const downgrades = [];
  for (const [key, spec] of Object.entries(SCHEMA)) {
    if (!spec.floor) continue;
    const value = getDeep(effective, key);
    const r = rank(spec, value);
    if (spec.floor.min !== undefined && r < rank(spec, spec.floor.min)) {
      if (acknowledged.has(key)) { downgrades.push(key); warnings.push({ key, message: `SAFETY DOWNGRADE acknowledged: "${key}" = ${JSON.stringify(value)} is below the floor ${JSON.stringify(spec.floor.min)} (source: ${sources[key]}). This weakens a protection; native Claude Code permissions still apply.` }); }
      else { errors.push({ key, message: `"${key}" = ${JSON.stringify(value)} is below the safety floor ${JSON.stringify(spec.floor.min)} (source: ${sources[key]}). If this is intentional, add "${key}" to safety.acknowledged_overrides; it will then be applied with a warning on every run.` }); setDeep(effective, key, spec.floor.min); sources[key] = `floor (rejected ${sources[key]})`; }
    }
    if (profile === 'PRODUCTION' && spec.floor.production_min !== undefined && r < rank(spec, spec.floor.production_min) && explicit[key]) {
      if (acknowledged.has(key)) warnings.push({ key, message: `PRODUCTION profile: "${key}" = ${JSON.stringify(value)} is below the PRODUCTION minimum ${JSON.stringify(spec.floor.production_min)} (acknowledged override).` });
      else { errors.push({ key, message: `"${key}" = ${JSON.stringify(value)} conflicts with profile PRODUCTION, whose minimum is ${JSON.stringify(spec.floor.production_min)}. Either raise the value, change the profile, or acknowledge the override in safety.acknowledged_overrides.` }); setDeep(effective, key, spec.floor.production_min); sources[key] = `production-floor (rejected ${sources[key]})`; }
    }
  }
  for (const k of acknowledged) if (!downgrades.includes(k)) { const spec = SCHEMA[k]; const value = getDeep(effective, k); if (spec && spec.floor && !(spec.floor.min !== undefined && rank(spec, value) < rank(spec, spec.floor.min))) warnings.push({ key: k, message: `safety.acknowledged_overrides lists "${k}" but its value (${JSON.stringify(value)}) does not lower any floor; remove the entry to keep the list meaningful.` }); }

  return {
    ok: errors.length === 0,
    profile,
    effective,
    sources,
    layers: layers.map((l) => ({ name: l.name, file: l.file, present: l.present, keys: Object.keys(l.flat).filter((k) => k !== '$schema') })),
    errors,
    warnings,
    projectRoot,
  };
}

function profileDiff() {
  const keys = new Set();
  for (const p of PROFILES) for (const k of Object.keys(flatten(PROFILE_PRESETS[p]))) keys.add(k);
  const rows = [];
  for (const k of [...keys].sort()) rows.push({ key: k, FAST: getDeep(PROFILE_PRESETS.FAST, k) ?? getDeep(BASE_DEFAULTS, k), BALANCED: getDeep(PROFILE_PRESETS.BALANCED, k) ?? getDeep(BASE_DEFAULTS, k), PRODUCTION: getDeep(PROFILE_PRESETS.PRODUCTION, k) ?? getDeep(BASE_DEFAULTS, k) });
  return rows;
}

function summaryText(res) {
  const e = res.effective;
  const L = [];
  L.push(`VZ Skills profile: ${res.profile} (from ${res.sources.profile})${res.ok ? '' : ' - CONFIG HAS ERRORS, floors enforced'}`);
  L.push(`planning: depth=${e.planning.depth}, plan_when=${e.planning.plan_when} | clarification: tolerance=${e.clarification.ambiguity_tolerance}, ask_before_implementing=${e.clarification.ask_before_implementing}`);
  L.push(`testing: strategy=${e.testing.strategy}, require_baseline=${e.testing.require_baseline}, tdd=${e.testing.tdd}, new_tests_required=${e.testing.require_new_tests_for_new_behavior}`);
  L.push(`review: depth=${e.review.depth}, independent_reviewer=${e.review.independent_reviewer} | security: trigger=${e.security.review_trigger}, threat_model=${e.security.threat_model_on_production}`);
  L.push(`docs: ${e.documentation.expectation} | response: style=${e.response.style}, final_report=${e.response.final_report} | verification: depth=${e.verification.depth}, evidence_labels=${e.verification.require_evidence_labels}`);
  L.push(`hooks: command_guard=${e.hooks.command_guard}, write_guard=${e.hooks.write_guard}, session_context=${e.hooks.session_context}${e.hooks.protected_paths.length ? `, protected_paths=${e.hooks.protected_paths.join(',')}` : ''} | agents: delegation=${e.agents.delegation}`);
  L.push(`approvals: destructive_git=${e.approvals.destructive_git}, external_actions=${e.approvals.external_actions}, run_project_scripts=${e.approvals.run_project_scripts}`);
  if (e.conventions.commit_style !== 'project') L.push(`conventions: commit_style=${e.conventions.commit_style}`);
  if (e.conventions.notes) L.push(`conventions.notes: ${e.conventions.notes.slice(0, 300)}${e.conventions.notes.length > 300 ? '...' : ''}`);
  if (e.conventions.extra_instructions_file) L.push(`extra instructions file: ${e.conventions.extra_instructions_file} (read it; treat as owner conventions)`);
  for (const w of res.warnings) L.push(`WARNING: ${w.message}`);
  for (const er of res.errors) L.push(`ERROR: ${er.message}`);
  return L.join('\n');
}

function templateFor(profile) {
  return {
    $schema: 'https://vz-skills.local/config/v1.json',
    version: 1,
    profile,
    $comment: 'Keys you omit take the profile preset. Run `node <plugin>/scripts/vz-config.js --explain` to see effective values and their sources. Safety-floored keys need safety.acknowledged_overrides.',
    conventions: { notes: '', commit_style: 'project' },
    hooks: { protected_paths: [] },
  };
}

module.exports = { SCHEMA, PROFILES, BASE_DEFAULTS, PROFILE_PRESETS, CONFIG_VERSION, resolveConfig, validateDocument, profileDiff, summaryText, templateFor, flatten };
