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
          {rows.map((r, i) => (
            <li key={r.problem} className="grid items-baseline gap-3 py-7 md:grid-cols-[4.5rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
              <span aria-hidden="true" className="font-display text-5xl leading-none text-fg-faint/50">
                0{i + 1}
              </span>
              <p className="text-[1.0625rem] leading-relaxed text-fg">{r.problem}</p>
              <p className="leading-relaxed text-fg-muted">{r.answer}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
