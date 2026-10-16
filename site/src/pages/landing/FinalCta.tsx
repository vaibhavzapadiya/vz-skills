import { Container } from '@/components/Section';
import { LinkButton } from '@/components/Button';
import { CommandLine } from '@/components/CodeBlock';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';

export function FinalCta() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="panel relative overflow-hidden px-6 py-16 sm:px-12 sm:py-20">
          <div aria-hidden="true" className="rule-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="relative mx-auto max-w-[40rem] text-center">
            <p className="eyebrow">Start here</p>
            <h2 className="font-display mt-4 text-title text-fg [text-wrap:balance]">Install, then run a read-only status check.</h2>
            <p className="mt-4 text-fg-muted [text-wrap:pretty]">
              Nothing in your project changes until you ask. The first thing VZ Skills does is tell you what it sees, with the evidence for each
              claim.
            </p>
            <div className="mx-auto mt-8 max-w-[28rem] text-left">
              <CommandLine command={SITE.install} />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <LinkButton to="/docs/getting-started" size="lg">
                Getting started <IconArrowRight size={16} />
              </LinkButton>
              <LinkButton to="/docs/commands" size="lg" variant="secondary">
                Command reference
              </LinkButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
