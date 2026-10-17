import { Link } from 'react-router';
import { Container } from './Section';
import { Wordmark } from './Logo';
import { LinkButton } from './Button';
import { CommandLine } from './CodeBlock';
import { IconArrowRight, IconArrowUpRight, IconGithub, IconPackage } from './Icons';
import { SITE } from '@/lib/utils';

/** `to` starting with http opens in a new tab; everything else is a docs route. */
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
  {
    title: 'Source',
    links: [
      { to: SITE.repo, label: 'GitHub repository' },
      { to: SITE.npm, label: 'npm package' },
      { to: `${SITE.repo}/issues`, label: 'Report an issue' },
      { to: '/docs/contributing', label: 'Contributing' },
    ],
  },
];

const facts = [`v${SITE.version}`, `Claude Code ${SITE.minClaude}+`, `Node ${SITE.minNode}+`, 'MIT'];

function BackToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-muted transition-colors duration-fast hover:bg-bg-sunken hover:text-fg"
    >
      Back to top
      <span aria-hidden="true">↑</span>
    </button>
  );
}

/** `compact` drops the install call to action; the docs pages use it. */
export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className="border-t border-border bg-bg-sunken/60">
      <Container>
        {!compact && (
          <div className="grid items-center gap-8 border-b border-border py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
            <div>
              <h2 className="font-display text-title text-fg [text-wrap:balance]">Start with a read-only check.</h2>
              <p className="mt-3 max-w-[30rem] text-fg-muted [text-wrap:pretty]">
                Install it, run <code className="font-mono text-fg">/vz-status</code>, and see what it sees. Nothing changes until you ask.
              </p>
            </div>
            <div className="space-y-3">
              <CommandLine command={SITE.install} />
              <div className="flex flex-wrap gap-3">
                <LinkButton to="/docs/getting-started">
                  Getting started <IconArrowRight size={16} />
                </LinkButton>
                <LinkButton to="/docs/commands" variant="secondary">
                  Commands
                </LinkButton>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-fg-muted">{SITE.tagline}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="At a glance">
              {facts.map((f) => (
                <li key={f} className="rounded-full border border-border bg-bg-raised px-2.5 py-0.5 font-mono text-[0.6875rem] text-fg-muted">
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-raised px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg"
              >
                <IconGithub size={14} /> {SITE.repoSlug}
              </a>
              <a
                href={SITE.npm}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg-raised px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg"
              >
                <IconPackage size={14} /> npm: {SITE.packageName}
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="eyebrow">{c.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.to}>
                    {/^https?:/.test(l.to) ? (
                      <a href={l.to} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-fg-muted transition-colors duration-fast hover:text-fg">
                        {l.label}
                        <IconArrowUpRight size={12} className="text-fg-faint" />
                      </a>
                    ) : (
                      <Link to={l.to} className="text-sm text-fg-muted transition-colors duration-fast hover:text-fg">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border py-5 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
          <p>MIT License. A plugin for Claude Code; not affiliated with Anthropic.</p>
          <BackToTop />
        </div>
      </Container>
    </footer>
  );
}
