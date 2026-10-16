import { useState } from 'react';
import { Container } from '@/components/Section';
import { LinkButton } from '@/components/Button';
import { CodeBlock, CommandLine } from '@/components/CodeBlock';
import { Tabs } from '@/components/Tabs';
import { Window } from '@/components/Window';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';
import { completionReport, discoveryBrief, planSample } from '@/data/samples';

const stages = [
  { id: 'discover', label: 'Discover', code: discoveryBrief, title: '/discover' },
  { id: 'plan', label: 'Plan', code: planSample, title: '/plan' },
  { id: 'verify', label: 'Verify', code: completionReport, title: '/verify' },
];

export function Hero() {
  const [stage, setStage] = useState('discover');
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="rule-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />
      <Container className="relative pt-16 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16">
          <div className="motion-safe:animate-fade-up">
            <p className="eyebrow">A plugin for Claude Code</p>
            <h1 className="font-display mt-6 text-display text-fg [text-wrap:balance]">Evidence before claims.</h1>
            <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-fg-muted [text-wrap:pretty]">
              A disciplined lifecycle for Claude Code: discover, plan, build, test, review, and a final report that says exactly what was
              verified.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton to="/docs/getting-started" size="lg">
                Get started
                <IconArrowRight size={16} />
              </LinkButton>
              <LinkButton to="/docs" size="lg" variant="secondary">
                Read the docs
              </LinkButton>
            </div>
            <div className="mt-8 max-w-[26rem]">
              <CommandLine command={SITE.install} />
              <p className="mt-3 text-[0.8125rem] text-fg-faint">
                Needs Claude Code {SITE.minClaude}+ and Node.js {SITE.minNode}+.
              </p>
            </div>
          </div>

          <div className="motion-safe:animate-fade-up [animation-delay:120ms]">
            <Window title="claude · my-app">
              <Tabs
                aria-label="Stages of the lifecycle"
                variant="segmented"
                value={stage}
                onChange={setStage}
                listClassName="m-3 !border-border-code !bg-bg-code-raised [&_[role=tab]]:text-fg-code-muted [&_[role=tab][aria-selected=true]]:!bg-bg-code [&_[role=tab][aria-selected=true]]:!text-fg-code [&_[role=tab]:hover]:text-fg-code"
                tabs={stages.map((s) => ({
                  id: s.id,
                  label: s.label,
                  content: (
                    <CodeBlock
                      code={s.code}
                      language="text"
                      title={s.title}
                      className="!rounded-none !border-0 !border-t !shadow-none [&_pre]:max-h-[24rem] [&_pre]:min-h-[20rem]"
                    />
                  ),
                }))}
              />
            </Window>
            <p className="mt-3 text-xs text-fg-faint">Real output from the plugin's scripts and skill templates.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
