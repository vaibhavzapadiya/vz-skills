import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Label } from '@/components/Label';
import { IconArrowRight, IconFlask, IconList, IconReplay } from '@/components/Icons';

/**
 * The three features that make "evidence before claims" enforceable rather than a request:
 * the claim check (Stop hook), /prove-test, and the activity ledger. Previews use the plugin's
 * real message and output formats.
 */

function ClaimPreview() {
  return (
    <div className="space-y-2.5 text-[0.8125rem] leading-relaxed">
      <p className="rounded-lg border border-border bg-bg-raised px-3 py-2 text-fg">
        <span className="text-fg-faint">Claude: </span>Fixed the parser. All tests pass.
      </p>
      <p className="rounded-lg border border-warn/30 bg-warn-soft px-3 py-2 text-warn">
        <span className="font-mono text-[0.75rem]">claim check</span> - no test ran after the last code edit (src/parser.ts). Run it, or say NOT VERIFIED.
      </p>
      <p className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-raised px-3 py-2 text-fg">
        <code className="font-mono text-[0.75rem]">npm test -- parser</code>
        <span className="text-fg-muted">14 passed, exit 0</span>
        <Label size="xs">TESTED</Label>
      </p>
    </div>
  );
}

function ProvePreview() {
  const rows: Array<[string, string, string]> = [
    ['parser.test.ts', 'fails', 'PROVEN'],
    ['utils.test.ts', 'passes', 'NOT PROVEN'],
  ];
  return (
    <div className="overflow-hidden rounded-lg border border-border text-[0.8125rem]">
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-border bg-bg-sunken px-3 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-fg-faint">
        <span>Test</span>
        <span>Without change</span>
        <span>Verdict</span>
      </div>
      {rows.map(([t, w, v]) => (
        <div key={t} className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-2 border-b border-border px-3 py-2.5 last:border-b-0">
          <code className="truncate font-mono text-[0.75rem] text-fg">{t}</code>
          <span className={w === 'fails' ? 'text-ok' : 'text-warn'}>{w}</span>
          <span>
            <Label size="xs" tone={v === 'PROVEN' ? 'ok' : 'warn'}>
              {v}
            </Label>
          </span>
        </div>
      ))}
    </div>
  );
}

function LedgerPreview() {
  const lines: Array<[string, string, ReactNode]> = [
    ['12:04', 'edit', <code key="a">src/parser.ts</code>],
    ['12:05', 'check', <span key="b"><code>npm test -- parser</code> <span className="text-ok">passed</span></span>],
    ['12:06', 'edit', <code key="c">src/lexer.ts</code>],
    ['12:07', 'check', <span key="d"><code>npm run lint</code> <span className="text-danger">failed</span></span>],
  ];
  return (
    <ol className="space-y-1.5 font-mono text-[0.75rem]">
      {lines.map(([t, kind, what]) => (
        <li key={t} className="grid grid-cols-[3rem_3.25rem_minmax(0,1fr)] items-baseline gap-2 rounded-md px-2 py-1 even:bg-bg-sunken/70">
          <span className="text-fg-faint">{t}</span>
          <span className="text-fg-muted">{kind}</span>
          <span className="truncate text-fg [&_code]:text-fg">{what}</span>
        </li>
      ))}
    </ol>
  );
}

const cards: Array<{ icon: ReactNode; title: string; body: string; who: string; to: string; preview: ReactNode }> = [
  {
    icon: <IconReplay size={20} />,
    title: 'It cannot say "done" without proof.',
    body: 'When Claude claims success after changing code, a hook checks that a test, lint, typecheck or build actually ran after the last edit. If not, Claude goes back once to run it, or says NOT VERIFIED.',
    who: 'claim check hook',
    to: '/docs/guards',
    preview: <ClaimPreview />,
  },
  {
    icon: <IconFlask size={20} />,
    title: 'Its tests have to prove something.',
    body: '/prove-test runs a new test against the code without your change, in a throwaway git worktree. A test that passes either way is not testing the change, and the report says so.',
    who: '/prove-test',
    to: '/docs/commands',
    preview: <ProvePreview />,
  },
  {
    icon: <IconList size={20} />,
    title: 'Everything it did is on record.',
    body: 'Every file edit and command is written to an activity ledger outside your repository, secrets redacted. /ledger shows the timeline; reviewers see exactly what ran and what failed.',
    who: '/ledger',
    to: '/docs/guards',
    preview: <LedgerPreview />,
  },
];

export function Proof() {
  return (
    <Section id="proof">
      <Container>
        <SectionHeading
          number="02"
          eyebrow="Proof, not promises"
          title="An assistant that cannot fake success."
          lead="Instructions ask Claude to be honest. These three features check that it was."
        />
        <figure className="mt-10">
          <img
            src={`${import.meta.env.BASE_URL}claim-check-demo.svg`}
            width={820}
            height={336}
            loading="lazy"
            alt="Animated illustration: Claude says 'Fixed the parser. All tests pass.' without running a test; the claim check sends it back; Claude runs npm test, 14 tests pass, and the reply is labelled TESTED."
            className="mx-auto h-auto w-full max-w-[820px] rounded-xl shadow-lg ring-1 ring-border"
          />
        </figure>
        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.title} className="panel flex flex-col p-6">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent-soft-fg ring-1 ring-inset ring-accent/15">{c.icon}</span>
              <h3 className="mt-5 text-lg font-semibold leading-snug tracking-[-0.01em] text-fg [text-wrap:balance]">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted [text-wrap:pretty]">{c.body}</p>
              <div className="mt-6 flex-1">{c.preview}</div>
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <code className="rounded-md border border-border bg-bg-sunken px-2 py-1 font-mono text-xs text-fg">{c.who}</code>
                <Link to={c.to} className="inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline">
                  How it works <IconArrowRight size={14} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
