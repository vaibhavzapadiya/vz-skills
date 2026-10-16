import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { CodeBlock } from '@/components/CodeBlock';
import { Label } from '@/components/Label';
import { IconArrowRight } from '@/components/Icons';
import { guardAsk } from '@/data/samples';

const pretty = (json: string) => JSON.stringify(JSON.parse(json), null, 2);

const points = [
  { title: 'Your work is preserved.', body: 'Dirty files are left alone; destructive git commands ask first.' },
  { title: 'Repository text is data.', body: 'A CLAUDE.md that says "ignore previous instructions" is flagged, not followed.' },
  { title: 'Secrets stay unread.', body: '.env files and keys are never opened by VZ scripts.' },
];

export function Safety() {
  return (
    <Section id="safety" bleed>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <SectionHeading
              number="04"
              eyebrow="Safety"
              title="Advisory guards, not a sandbox."
              lead="Hooks ask or deny risky commands and writes. They fail open, and Claude Code's own permissions remain the boundary."
            />
            <ul className="mt-8 space-y-4">
              {points.map((p) => (
                <li key={p.title} className="text-[0.9375rem] leading-relaxed text-fg-muted">
                  <span className="font-medium text-fg">{p.title}</span> {p.body}
                </li>
              ))}
            </ul>
            <Link to="/docs/security" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              Threat model and limits <IconArrowRight size={14} />
            </Link>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-xs text-fg-muted">
              <span>$ git reset --hard HEAD~1</span>
              <Label size="xs">ask</Label>
            </div>
            <CodeBlock code={pretty(guardAsk)} language="json" title="command-guard.js output" wrap />
          </div>
        </div>
      </Container>
    </Section>
  );
}
