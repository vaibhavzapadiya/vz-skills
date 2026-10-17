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
  version: '0.2.1',
  install: 'npx vz-skills install --flat',
  repo: 'https://github.com/vaibhavzapadiya/vz-skills',
  repoSlug: 'vaibhavzapadiya/vz-skills',
  npm: 'https://www.npmjs.com/package/vz-skills',
  /** Claude Code's plugin manager, straight from the GitHub repository (no npm). */
  marketplace: {
    add: '/plugin marketplace add vaibhavzapadiya/vz-skills',
    install: '/plugin install vz-skills@vz-skills-marketplace',
  },
  minClaude: '2.1.233',
  recommendedClaude: '2.1.259',
  minNode: '18',
  counts: { skills: 33, agents: 3, hooks: 5, tests: 107, fixtures: 17 },
} as const;
