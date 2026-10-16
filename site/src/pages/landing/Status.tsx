import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Label } from '@/components/Label';
import { IconArrowRight } from '@/components/Icons';

const rows = [
  { label: 'TESTED', what: 'Plugin structure, manifest, and frontmatter against the official validator (claude plugin validate --strict).' },
  { label: 'TESTED', what: 'Discovery across 17 sample repositories: TypeScript, Python, Go, .NET, Ruby, PHP, Maven, Gradle, monorepo, dirty trees, malicious instruction files, malformed manifests, missing tools.' },
  { label: 'TESTED', what: 'Configuration: presets, precedence, safety floors, acknowledged overrides, typo suggestions, JSON Schema agreement.' },
  { label: 'TESTED', what: 'Hooks: every deny and ask category, PowerShell parity, fail-open on malformed input, output size cap, latency budget.' },
  { label: 'TESTED', what: 'Both install forms (plugin and flat) against an isolated Claude config directory, packaging integrity, documentation accuracy.' },
  { label: 'BLOCKED', what: 'Live-session behaviour of the prose skills. An eval suite ships with three cases; running it needs claude plugin eval on a newer Claude Code than the build machine had.' },
  { label: 'NOT VERIFIED', what: 'Any claim that VZ Skills performs better than plain Claude Code. None is made; the methodology for measuring it is documented.' },
];

export function Status() {
  return (
    <Section id="status" bleed>
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeading
            number="08"
            eyebrow="Honest status"
            title="The same labels, applied to this project."
            lead="Version 0.1.0 is usable today, with limits stated the way the plugin states them. The automated suite runs 90 tests with no installs and no network; guards and the injection scanner are heuristics that catch common accidents, not every adversary."
          />
          <div>
            <ul className="panel divide-y divide-border px-6">
              {rows.map((r, i) => (
                <li key={i} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-4 py-4">
                  <Label>{r.label}</Label>
                  <p className="text-sm leading-relaxed text-fg-muted [text-wrap:pretty]">{r.what}</p>
                </li>
              ))}
            </ul>
            <Link to="/docs/limitations" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              Limitations and compatibility <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
