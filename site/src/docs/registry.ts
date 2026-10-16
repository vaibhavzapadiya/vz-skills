import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type DocPage = {
  slug: string; // '' for the docs index
  title: string;
  description: string;
  group: string;
  component: LazyExoticComponent<ComponentType>;
};

export type DocGroup = { id: string; title: string; pages: DocPage[] };

const page = (slug: string, title: string, description: string, group: string, load: () => Promise<{ default: ComponentType }>): DocPage => ({
  slug,
  title,
  description,
  group,
  component: lazy(load),
});

/** Ordered documentation tree. Prev/next and the sidebar follow this order. */
export const docGroups: DocGroup[] = [
  {
    id: 'start',
    title: 'Start here',
    pages: [
      page('', 'Overview', 'What VZ Skills does, who it is for, and the ideas behind it.', 'start', () => import('./content/overview.mdx')),
      page('getting-started', 'Getting started', 'From install to a first verified change in five steps.', 'start', () => import('./content/getting-started.mdx')),
      page('installation', 'Installation', 'Every supported install method, scopes, update, rollback, uninstall.', 'start', () => import('./content/installation.mdx')),
    ],
  },
  {
    id: 'concepts',
    title: 'Concepts',
    pages: [
      page('concepts', 'Core concepts', 'Evidence labels, profiles, risk tiers, the core policy, and the trust model.', 'concepts', () => import('./content/concepts.mdx')),
      page('configuration', 'Configuration', 'Files, precedence, every key with defaults and allowed values, safety floors.', 'concepts', () => import('./content/configuration.mdx')),
    ],
  },
  {
    id: 'guides',
    title: 'Guides',
    pages: [
      page('lifecycle', 'The lifecycle', 'How a request moves from clarify to verify, and what each step produces.', 'guides', () => import('./content/lifecycle.mdx')),
      page('discovery', 'Repository discovery', 'What the discovery engine detects, how facts are labelled, and the baseline allowlist.', 'guides', () => import('./content/discovery.mdx')),
      page('guards', 'Hooks and guards', 'The command guard, write guard, and session brief: decisions, configuration, limits.', 'guides', () => import('./content/guards.mdx')),
      page('agents', 'Agents', 'Three read-only subagents, when they run, and the handoff contract.', 'guides', () => import('./content/agents.mdx')),
      page('examples', 'Usage examples', 'Realistic sessions: a feature, a bug, a review, a release check.', 'guides', () => import('./content/examples.mdx')),
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    pages: [
      page('commands', 'Commands', 'All 24 skills with invocation, arguments, who runs them, and what they produce.', 'reference', () => import('./content/commands.mdx')),
      page('cli', 'CLI reference', 'npx vz-skills, vz-discover.js, vz-config.js, vz-validate.js: options, outputs, exit codes.', 'reference', () => import('./content/cli.mdx')),
    ],
  },
  {
    id: 'project',
    title: 'Project',
    pages: [
      page('security', 'Security', 'Trust boundaries, threat scenarios and mitigations, residual risks.', 'project', () => import('./content/security.mdx')),
      page('troubleshooting', 'Troubleshooting', 'Symptoms, likely causes, and what to do.', 'project', () => import('./content/troubleshooting.mdx')),
      page('limitations', 'Limitations and compatibility', 'Supported versions, what is tested, what is not, known constraints.', 'project', () => import('./content/limitations.mdx')),
      page('faq', 'FAQ', 'Short answers to recurring questions.', 'project', () => import('./content/faq.mdx')),
      page('contributing', 'Contributing', 'Local development, tests, adding a skill, releasing.', 'project', () => import('./content/contributing.mdx')),
      page('changelog', 'Changelog', 'Release history.', 'project', () => import('./content/changelog.mdx')),
    ],
  },
];

export const docPages: DocPage[] = docGroups.flatMap((g) => g.pages);

export const docPath = (slug: string) => (slug ? `/docs/${slug}` : '/docs');

export function findDoc(slug: string): DocPage | undefined {
  return docPages.find((p) => p.slug === slug);
}

export function neighbours(slug: string): { prev?: DocPage; next?: DocPage } {
  const i = docPages.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return { prev: docPages[i - 1], next: docPages[i + 1] };
}

export function groupOf(slug: string): DocGroup | undefined {
  return docGroups.find((g) => g.pages.some((p) => p.slug === slug));
}
