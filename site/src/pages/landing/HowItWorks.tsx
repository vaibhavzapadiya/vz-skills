import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { IconArrowRight } from '@/components/Icons';

const steps = [
  { name: 'Discover', skill: '/discover', text: 'Stack, commands and tests, each with its evidence.' },
  { name: 'Clarify', skill: '/clarify', text: 'Checkable acceptance criteria and a risk tier.' },
  { name: 'Plan', skill: '/plan', text: 'Thin slices, each with a test and a verify command.' },
  { name: 'Build', skill: '/implement', text: 'One slice at a time, smallest change first.' },
  { name: 'Test', skill: '/test', text: 'Baseline first, so old failures are not blamed on you.' },
  { name: 'Review', skill: '/review', text: 'Ranked findings, optionally by a fresh-context agent.' },
  { name: 'Verify', skill: '/verify', text: 'Every claim labelled with evidence, or marked NOT VERIFIED.' },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" bleed>
      <Container>
        <SectionHeading
          number="02"
          eyebrow="How it works"
          title="Seven small steps."
          lead="The router picks the steps a request needs. A one-line fix skips most of them; a change to auth gets all of them."
        />
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.name} className="panel panel-hover flex flex-col p-5">
              <span className="tabular font-mono text-xs text-fg-faint">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-fg">{s.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted">{s.text}</p>
              <code className="mt-4 font-mono text-xs text-fg-muted">{s.skill}</code>
            </li>
          ))}
          <li className="flex items-center rounded-xl border border-dashed border-border-strong p-5 sm:col-span-2 lg:col-span-1">
            <Link to="/docs/concepts#how-a-request-flows" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              See how a request flows <IconArrowRight size={14} />
            </Link>
          </li>
        </ol>
      </Container>
    </Section>
  );
}
