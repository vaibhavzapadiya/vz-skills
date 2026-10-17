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
      page('', 'Overview', 'What VZ Toolkit is, in a few lines.', 'start', () => import('./content/overview.mdx')),
      page('getting-started', 'Getting started', 'Install it and make your first change.', 'start', () => import('./content/getting-started.mdx')),
      page('installation', 'Installation', 'The install forms, scopes, update and removal.', 'start', () => import('./content/installation.mdx')),
    ],
  },
  {
    id: 'learn',
    title: 'Learn',
    pages: [
      page('concepts', 'Concepts', 'Evidence labels, profiles, risk, and how a request flows.', 'learn', () => import('./content/concepts.mdx')),
      page('configuration', 'Configuration', 'The settings file and every key.', 'learn', () => import('./content/configuration.mdx')),
    ],
  },
  {
    id: 'reference',
    title: 'Reference',
    pages: [
      page('commands', 'Commands', 'All 33 skills, by group.', 'reference', () => import('./content/commands.mdx')),
      page('guards', 'Hooks and agents', 'What the guards ask or deny, the activity ledger and claim check, and the three review agents.', 'reference', () => import('./content/guards.mdx')),
      page('cli', 'CLI', 'The installer and the scripts inside the plugin.', 'reference', () => import('./content/cli.mdx')),
    ],
  },
  {
    id: 'project',
    title: 'Project',
    pages: [
      page('security', 'Security and limits', 'What it protects, what it does not, and what is tested.', 'project', () => import('./content/security.mdx')),
      page('troubleshooting', 'Troubleshooting', 'Common problems and fixes.', 'project', () => import('./content/troubleshooting.mdx')),
      page('faq', 'FAQ', 'Short answers.', 'project', () => import('./content/faq.mdx')),
      page('contributing', 'Contributing', 'Run it locally, add a skill, release.', 'project', () => import('./content/contributing.mdx')),
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
