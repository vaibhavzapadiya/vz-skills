import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { CodeBlock, CommandLine } from '@/components/CodeBlock';
import { IconArrowRight, IconArrowUpRight, IconGithub, IconPackage } from '@/components/Icons';
import { SITE } from '@/lib/utils';

const firstRun = `/vz-status      # profile, repository brief, hook status
/discover       # stack, commands, tests, with evidence labels`;

const fromMarketplace = `${SITE.marketplace.add}
${SITE.marketplace.install}`;

const sources = [
  { href: SITE.npm, icon: <IconPackage size={18} />, label: 'npm', value: SITE.packageName },
  { href: SITE.repo, icon: <IconGithub size={18} />, label: 'GitHub', value: SITE.repoSlug },
];

export function Install() {
  return (
    <Section id="install">
      <Container>
        <div className="panel mx-auto max-w-3xl p-6 sm:p-10">
          <SectionHeading
            number="08"
            eyebrow="Install"
            title="Two commands to a first check."
            lead={`Needs Claude Code ${SITE.minClaude}+ and Node.js ${SITE.minNode}+. Nothing else is installed.`}
          />
          <div className="mt-8 space-y-5">
            <CommandLine command={SITE.install} />
            <CodeBlock language="text" title="then, inside Claude Code" code={firstRun} />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-fg-muted">
            Prefer namespaced commands such as <code className="font-mono text-fg">/vz-skills:plan</code>? Drop{' '}
            <code className="font-mono text-fg">--flat</code>. Rather skip npm? Add the GitHub marketplace from inside Claude Code:
          </p>
          <div className="mt-4">
            <CodeBlock language="text" title="or, with Claude Code's plugin manager" code={fromMarketplace} />
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="Where it is published">
            {sources.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-border bg-bg-raised px-4 py-3 transition-colors duration-fast hover:border-border-strong"
                >
                  <span className="text-fg-muted group-hover:text-fg">{s.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-fg-faint">{s.label}</span>
                    <span className="block font-mono text-sm text-fg [overflow-wrap:anywhere]">{s.value}</span>
                  </span>
                  <IconArrowUpRight size={14} className="text-fg-faint group-hover:text-fg" />
                </a>
              </li>
            ))}
          </ul>

          <Link to="/docs/installation" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
            All install options <IconArrowRight size={14} />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
