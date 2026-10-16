import { useState } from 'react';
import { Container } from '@/components/Section';
import { LinkButton } from '@/components/Button';
import { CodeBlock, CommandLine } from '@/components/CodeBlock';
import { Tabs } from '@/components/Tabs';
import { Window } from '@/components/Window';
import { Label } from '@/components/Label';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';
import { clarifySample, completionReport, discoveryBrief, planSample } from '@/data/samples';

const stages = [
  { id: 'discover', label: 'Discover', code: discoveryBrief, title: '/discover · fixtures/ts-app', lang: 'text' },
  { id: 'clarify', label: 'Clarify', code: clarifySample, title: '/clarify · acceptance criteria', lang: 'text' },
  { id: 'plan', label: 'Plan', code: planSample, title: '/plan · thin slices', lang: 'text' },
  { id: 'verify', label: 'Verify', code: completionReport, title: '/verify · evidence-table report', lang: 'text' },
];

export function Hero() {
  const [stage, setStage] = useState('discover');
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="rule-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />
      <Container className="relative pt-16 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16">
          <div className="motion-safe:animate-fade-up">
            <p className="eyebrow flex flex-wrap items-center gap-x-3 gap-y-2">
              <span>A plugin for Claude Code</span>
              <span aria-hidden="true" className="h-3 w-px bg-border-strong" />
              <span className="tabular">v{SITE.version}</span>
              <span aria-hidden="true" className="h-3 w-px bg-border-strong" />
              <span>MIT</span>
            </p>
            <h1 className="font-display mt-6 text-display text-fg [text-wrap:balance]">
              Evidence before claims.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-fg-muted [text-wrap:pretty]">
              VZ Skills gives Claude Code a disciplined lifecycle. It discovers a repository before touching it, turns vague
              requests into checkable criteria, builds in small verified slices, runs the right tests, reviews its own work,
              and reports exactly what was verified and what was not.
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
            <div className="mt-8 max-w-[30rem]">
              <CommandLine command={SITE.install} />
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-fg-faint">
                Claude Code {SITE.minClaude}+ and Node.js {SITE.minNode}+. Zero runtime dependencies; nothing is downloaded at
                runtime. Unprefixed commands like <code className="font-mono text-fg-muted">/plan</code>; drop{' '}
                <code className="font-mono text-fg-muted">--flat</code> for the namespaced plugin form.
              </p>
            </div>
          </div>

          <div className="motion-safe:animate-fade-up [animation-delay:120ms] lg:pt-2">
            <Window
              title="claude · my-app"
              toolbar={
                <span className="hidden items-center gap-2 font-mono text-[0.6875rem] text-fg-code-muted sm:flex">
                  profile <span className="text-fg-code">BALANCED</span> · risk <span className="text-[#f2a1a1]">high</span>
                </span>
              }
            >
              <div className="border-b border-border-code px-4 py-3 font-mono text-[0.8125rem] leading-relaxed">
                <p>
                  <span className="text-fg-code-muted">&gt; </span>
                  <span className="text-fg-code">add rate limiting to the login endpoint</span>
                </p>
                <p className="mt-2 text-fg-code-muted">
                  Route: <span className="text-[#93a6ff]">clarify → plan → implement → test → review → security-review → verify</span>
                </p>
              </div>
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
                      language={s.lang}
                      title={s.title}
                      className="!rounded-none !border-0 !border-t !shadow-none [&_pre]:max-h-[26rem] [&_pre]:min-h-[22rem]"
                    />
                  ),
                }))}
              />
            </Window>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
              <span>Real output from the plugin's scripts and skill templates.</span>
              <Label size="xs">CONFIRMED</Label>
              <Label size="xs">UNKNOWN</Label>
              <Label size="xs">VERIFIED</Label>
              <Label size="xs">NOT VERIFIED</Label>
              <Label size="xs">BLOCKED</Label>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
