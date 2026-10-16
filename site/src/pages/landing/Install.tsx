import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { CodeBlock, CommandLine } from '@/components/CodeBlock';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';

const firstRun = `/vz-status      # profile, repository brief, hook status
/discover       # stack, commands, tests, with evidence labels`;

export function Install() {
  return (
    <Section id="install">
      <Container>
        <div className="panel mx-auto max-w-3xl p-6 sm:p-10">
          <SectionHeading
            number="05"
            eyebrow="Install"
            title="Two commands to a first check."
            lead={`Needs Claude Code ${SITE.minClaude}+ and Node.js ${SITE.minNode}+. Nothing else is installed.`}
          />
          <div className="mt-8 space-y-5">
            <CommandLine command={SITE.install} />
            <CodeBlock language="text" title="then, inside Claude Code" code={firstRun} />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-fg-muted">
            The package is not on the npm registry yet, so until it is, install from a clone. Prefer namespaced commands? Drop{' '}
            <code className="font-mono text-fg">--flat</code>.
          </p>
          <Link to="/docs/installation" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
            All install options <IconArrowRight size={14} />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
