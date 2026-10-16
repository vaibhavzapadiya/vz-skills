import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { IconArrowRight } from '@/components/Icons';

const steps = [
  { step: 'Understand', skill: 'discover', result: 'Stack, package manager, build/test/lint commands, CI, layout, instruction files, git state. Every fact is CONFIRMED, INFERRED, UNKNOWN, or CONFLICTING; nothing is guessed.' },
  { step: 'Clarify', skill: 'clarify', result: '3-8 checkable acceptance criteria, stated assumptions, scope boundary, risk tier.' },
  { step: 'Plan', skill: 'plan', result: 'Ordered thin slices, each with files, a test, and the exact command that verifies it.' },
  { step: 'Build', skill: 'implement', result: 'One slice at a time, test-first where it fits, narrowest check after each, your uncommitted files untouched.' },
  { step: 'Test', skill: 'test', result: 'Baseline recorded first; scope by profile; failures classified as pre-existing, regression, or environmental.' },
  { step: 'Review', skill: 'review, security-review', result: 'Ranked findings with file:line; optional fresh-context review by a read-only agent.' },
  { step: 'Verify', skill: 'verify', result: 'A report where every claim is IMPLEMENTED, TESTED, VERIFIED, BLOCKED, or NOT VERIFIED, with evidence.' },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works" bleed>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              number="02"
              eyebrow="How it works"
              title="One request, seven small workflows."
              lead="The router reads your profile and the repository brief, classifies the request, and names the steps it needs. A one-line fix skips most of them. A change to auth or payments gets all of them."
            />
            <p className="mt-6 text-sm leading-relaxed text-fg-muted">
              When something fails, <code className="font-mono text-fg">debug</code> finds the root cause before any fix. Specialists
              for performance, frontend, backend, database, API design, docs and release plug into the same flow.
            </p>
            <Link to="/docs/lifecycle" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              Read the lifecycle guide <IconArrowRight size={14} />
            </Link>
          </div>

          <ol className="relative">
            <span aria-hidden="true" className="absolute left-[1.1875rem] top-6 bottom-6 w-px bg-border-strong" />
            {steps.map((s, i) => (
              <li key={s.step} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-5 py-5 sm:gap-7">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-bg font-mono text-sm tabular text-fg">
                  {i + 1}
                </span>
                <div className="panel panel-hover p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-lg font-semibold text-fg">{s.step}</h3>
                    <code className="font-mono text-xs text-fg-muted">
                      {s.skill
                        .split(', ')
                        .map((n) => `/${n}`)
                        .join('  ')}
                    </code>
                  </div>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-fg-muted [text-wrap:pretty]">{s.result}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}
