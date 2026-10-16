import { Container, Section, SectionHeading } from '@/components/Section';
import { Label } from '@/components/Label';
import { CodeBlock } from '@/components/CodeBlock';
import { discoveryBrief } from '@/data/samples';

const factLabels = [
  { word: 'CONFIRMED', meaning: 'Read directly from a manifest, lockfile, CI file, or command output; the source is named.' },
  { word: 'INFERRED', meaning: 'Follows from a convention (a Maven wrapper implies ./mvnw test); the basis is stated.' },
  { word: 'UNKNOWN', meaning: 'Nothing established it. The skill will ask or stop; it will not invent a value.' },
  { word: 'CONFLICTING', meaning: 'Two sources disagree, for example a lockfile and a CLAUDE.md; both are shown.' },
];

const workLabels = [
  { word: 'IMPLEMENTED', meaning: 'The files exist.' },
  { word: 'TESTED', meaning: 'A check ran after the final edit and its result was observed.' },
  { word: 'VERIFIED', meaning: 'An acceptance criterion is met, with the evidence recorded.' },
  { word: 'BLOCKED', meaning: 'Cannot proceed; the reason and the unblock step are given.' },
  { word: 'NOT VERIFIED', meaning: 'No evidence. "Should work" lands here.' },
];

export function Labels() {
  return (
    <Section id="labels">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <SectionHeading
              number="03"
              eyebrow="Evidence labels"
              title="Two vocabularies, used everywhere."
              lead="The same words appear in the core policy, every skill, the report template, and the eval graders. Facts about the repository take one set; claims about the work take the other."
            />
            <div className="mt-10 space-y-8">
              <div>
                <h3 className="eyebrow mb-4">Facts about the repository</h3>
                <dl className="panel divide-y divide-border px-5">
                  {factLabels.map((l) => (
                    <div key={l.word} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4 py-3.5">
                      <dt>
                        <Label>{l.word}</Label>
                      </dt>
                      <dd className="text-sm leading-relaxed text-fg-muted">{l.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="eyebrow mb-4">Claims about the work</h3>
                <dl className="panel divide-y divide-border px-5">
                  {workLabels.map((l) => (
                    <div key={l.word} className="grid grid-cols-[8.5rem_minmax(0,1fr)] items-start gap-4 py-3.5">
                      <dt>
                        <Label>{l.word}</Label>
                      </dt>
                      <dd className="text-sm leading-relaxed text-fg-muted">{l.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
          <div className="lg:pt-16">
            <CodeBlock code={discoveryBrief} language="text" title="node vz-discover.js fixtures/ts-app --format md" />
            <p className="mt-3 text-xs leading-relaxed text-fg-faint">
              Verbatim output for the TypeScript sample repository shipped with the plugin. The format command is UNKNOWN because no
              manifest script, Makefile target, or CI step established one, and VZ does not guess.
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
