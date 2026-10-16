import { Link } from 'react-router';
import { Container } from './Section';
import { Wordmark } from './Logo';
import { SITE } from '@/lib/utils';

const columns: Array<{ title: string; links: Array<{ to: string; label: string }> }> = [
  {
    title: 'Start',
    links: [
      { to: '/docs', label: 'Overview' },
      { to: '/docs/getting-started', label: 'Getting started' },
      { to: '/docs/installation', label: 'Installation' },
      { to: '/docs/concepts', label: 'Concepts' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { to: '/docs/configuration', label: 'Configuration' },
      { to: '/docs/commands', label: 'Commands' },
      { to: '/docs/guards', label: 'Hooks and agents' },
      { to: '/docs/cli', label: 'CLI' },
    ],
  },
  {
    title: 'Project',
    links: [
      { to: '/docs/security', label: 'Security and limits' },
      { to: '/docs/troubleshooting', label: 'Troubleshooting' },
      { to: '/docs/faq', label: 'FAQ' },
      { to: '/docs/changelog', label: 'Changelog' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-sunken/60">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">{SITE.tagline}</p>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-mono text-xs text-fg-faint">
              <dt>Version</dt>
              <dd className="text-fg-muted tabular">{SITE.version}</dd>
              <dt>Claude Code</dt>
              <dd className="text-fg-muted tabular">{SITE.minClaude}+</dd>
              <dt>Node.js</dt>
              <dd className="text-fg-muted tabular">{SITE.minNode}+</dd>
              <dt>License</dt>
              <dd className="text-fg-muted">MIT</dd>
            </dl>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="eyebrow">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="text-sm text-fg-muted transition-colors duration-fast hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-6 text-xs text-fg-faint">
          MIT License. A plugin for Claude Code; not affiliated with Anthropic.
        </p>
      </Container>
    </footer>
  );
}
