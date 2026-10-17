import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Label } from '@/components/Label';
import { trackSpotlight } from '@/lib/spotlight';
import {
  IconArrowRight,
  IconCode,
  IconEye,
  IconFlask,
  IconLayers,
  IconListCheck,
  IconSearch,
  IconShieldCheck,
} from '@/components/Icons';

/**
 * `makes` is what the step hands to the next one. Status words are the plugin's own labels;
 * plain text is the output named in the README's table of steps.
 */
const steps: Array<{ name: string; skill: string; text: string; icon: ReactNode; makes: { label?: string; text?: string } }> = [
  { name: 'Discover', skill: '/discover', text: 'Stack, commands and tests, each with its evidence.', icon: <IconSearch size={20} />, makes: { label: 'CONFIRMED' } },
  { name: 'Clarify', skill: '/clarify', text: 'Checkable acceptance criteria and a risk tier.', icon: <IconListCheck size={20} />, makes: { text: '3 to 8 criteria' } },
  { name: 'Plan', skill: '/plan', text: 'Thin slices, each with a test and a verify command.', icon: <IconLayers size={20} />, makes: { text: 'ordered slices' } },
  { name: 'Build', skill: '/implement', text: 'One slice at a time, smallest change first.', icon: <IconCode size={20} />, makes: { label: 'IMPLEMENTED' } },
  { name: 'Test', skill: '/test', text: 'Baseline first, so old failures are not blamed on you.', icon: <IconFlask size={20} />, makes: { label: 'TESTED' } },
  { name: 'Review', skill: '/review', text: 'Ranked findings, optionally by a fresh-context agent.', icon: <IconEye size={20} />, makes: { text: 'ranked findings' } },
  { name: 'Verify', skill: '/verify', text: 'Every claim labelled with evidence, or marked NOT VERIFIED.', icon: <IconShieldCheck size={20} />, makes: { label: 'VERIFIED' } },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Container>
        <div className="container-card p-6 sm:p-10 lg:p-12">
          <SectionHeading
            number="03"
            eyebrow="How it works"
            title="Seven small steps."
            lead="The router picks the steps a request needs. A one-line fix skips most of them; a change to auth gets all of them."
          />
          <ol onPointerMove={trackSpotlight} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.name} data-spot className="panel panel-hover group relative flex flex-col overflow-hidden p-5">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-slow ease-out group-hover:scale-x-100"
                />
                <div className="flex items-start justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent-soft-fg ring-1 ring-inset ring-accent/15 transition-colors duration-base">
                    {s.icon}
                  </span>
                  <span className="tabular font-mono text-xs text-fg-faint">
                    <span className="sr-only">Step </span>0{i + 1}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-fg">{s.name}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-fg-muted [text-wrap:pretty]">{s.text}</p>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-border pt-4">
                  <code className="rounded-md border border-border bg-bg-sunken px-2 py-1 font-mono text-xs text-fg">{s.skill}</code>
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
                    <span className="sr-only">Produces</span>
                    {s.makes.label && <Label size="xs">{s.makes.label}</Label>}
                    {s.makes.text && <span className="truncate">{s.makes.text}</span>}
                  </span>
                </div>
              </li>
            ))}
            <li className="flex items-center rounded-xl border border-dashed border-border-strong p-5 sm:col-span-2 lg:col-span-1">
              <Link to="/docs/concepts#how-a-request-flows" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline">
                See how a request flows <IconArrowRight size={14} />
              </Link>
            </li>
          </ol>
        </div>
      </Container>
    </Section>
  );
}
