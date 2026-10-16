/** Join class names, dropping falsy values. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** GitHub-style slug for heading ids and anchors. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Extract plain text from React children (strings and nested elements). */
export function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    const props = (node as { props?: { children?: unknown } }).props;
    return textOf(props?.children);
  }
  return '';
}

export const SITE = {
  name: 'VZ Toolkit',
  /** The installable plugin, npm package and command prefix keep this name. */
  packageName: 'vz-skills',
  title: 'VZ Toolkit: skills, agents and guardrails for Claude Code',
  tagline: 'Skills, agents and guardrails for Claude Code.',
  version: '0.1.0',
  install: 'npx vz-skills install --flat',
  minClaude: '2.1.233',
  recommendedClaude: '2.1.259',
  minNode: '18',
  counts: { skills: 24, agents: 3, hooks: 3, tests: 91, fixtures: 17 },
} as const;
