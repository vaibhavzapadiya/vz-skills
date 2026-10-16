import { Container, Section, SectionHeading } from '@/components/Section';

const rows = [
  {
    problem: 'The agent guesses a test command and moves on.',
    answer: 'Discovery reads manifests and CI first. Every command is labelled with its evidence, and UNKNOWN stays UNKNOWN.',
  },
  {
    problem: '"Tests pass" is reported, but nothing ran after the last edit.',
    answer: 'Verify re-runs the checks and records each command with its observed result.',
  },
  {
    problem: 'Your uncommitted work gets reset along the way.',
    answer: 'Dirty files are left alone, and risky git commands ask first.',
  },
];

export function Why() {
  return (
    <Section id="why">
      <Container>
        <SectionHeading number="01" eyebrow="Why" title="Confidence is not evidence." />
        <ul className="panel mt-12 divide-y divide-border px-6 sm:px-8">
          {rows.map((r) => (
            <li key={r.problem} className="grid gap-3 py-6 md:grid-cols-2 md:gap-12">
              <p className="text-[1.0625rem] leading-relaxed text-fg">{r.problem}</p>
              <p className="leading-relaxed text-fg-muted">{r.answer}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
