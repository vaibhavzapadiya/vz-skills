import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Accordion } from '@/components/Accordion';

export const faqItems = [
  {
    id: 'faq-boundary',
    question: 'Does VZ Skills replace Claude Code’s permissions or sandbox?',
    answer: (
      <p>
        No. Claude Code’s permissions and sandbox are the security boundary. VZ hooks are advisory: they can ask, deny, or stay silent,
        and they fail open on a crash or timeout so a guard can never lock you out of your shell. Nothing in VZ configuration can grant
        what Claude Code forbids.
      </p>
    ),
  },
  {
    id: 'faq-prefix',
    question: 'Why are the commands prefixed /vz-skills: and how do I get plain /plan?',
    answer: (
      <p>
        Claude Code namespaces every plugin’s commands with the plugin name and has no switch to turn that off. Run{' '}
        <code>npx vz-skills install --flat</code> instead: it places the same skills, agents, hooks, and scripts into your Claude config
        (or the project’s <code>.claude/</code>), where names are not prefixed. Do not combine a flat install and a plugin install in the
        same scope, or every skill appears twice.
      </p>
    ),
  },
  {
    id: 'faq-scripts',
    question: 'Does discovery run my project’s scripts?',
    answer: (
      <p>
        Not by default. Discovery reads manifests, Makefiles, CI files, and instruction files; it executes nothing unless you ask for a
        baseline with <code>--baseline</code>, and then only well-known test commands such as <code>npm test</code>, <code>pytest</code>, or{' '}
        <code>go test ./...</code> from a conservative allowlist. Anything else is reported as BLOCKED with the reason.
      </p>
    ),
  },
  {
    id: 'faq-secrets',
    question: 'Will it read my .env file?',
    answer: (
      <p>
        VZ scripts never open <code>.env</code> files, keys, or tokens; discovery lists sensitive paths by name only and redacts key-like
        strings from anything it echoes. The write guard asks before writing to a secrets file or writing credential-looking content, and the
        command guard asks before <code>cat .env</code>, <code>printenv</code>, and similar.
      </p>
    ),
  },
  {
    id: 'faq-guards-off',
    question: 'Can I turn the guards off?',
    answer: (
      <p>
        Yes, deliberately. <code>hooks.command_guard</code>, <code>hooks.write_guard</code>, and <code>verification.require_evidence_labels</code>{' '}
        have safety floors; lowering one is an error until you list the key in <code>safety.acknowledged_overrides</code>, and then every
        session start prints a SAFETY DOWNGRADE warning. The session brief can be disabled without acknowledgment.
      </p>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading number="06" eyebrow="Questions" title="Questions." />
            <p className="mt-6 text-sm leading-relaxed text-fg-muted">
              More in the <Link to="/docs/faq" className="text-accent underline underline-offset-4">documentation FAQ</Link> and the{' '}
              <Link to="/docs/troubleshooting" className="text-accent underline underline-offset-4">troubleshooting table</Link>.
            </p>
          </div>
          <Accordion items={faqItems} className="panel !divide-y !border-y-0 px-6" />
        </div>
      </Container>
    </Section>
  );
}
