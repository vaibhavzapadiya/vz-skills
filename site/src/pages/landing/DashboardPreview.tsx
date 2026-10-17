import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { CommandLine } from '@/components/CodeBlock';
import { IconArrowRight } from '@/components/Icons';

/**
 * A miniature of the page /dashboard writes (scripts/vz-dashboard.js): same sections, sample values.
 * Marked as an example so it is never read as this project's own status.
 */
const stats: Array<[string, string, string?]> = [
  ['BALANCED', 'VZ profile'],
  ['feat/rate-limit', 'branch'],
  ['2', 'uncommitted files', 'text-warn'],
  ['4', 'decisions (1 proposed)'],
  ['12/13', 'checks passed', 'text-warn'],
];

export function DashboardPreview() {
  return (
    <Section id="dashboard">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div>
            <SectionHeading
              number="05"
              eyebrow="Dashboard"
              title="Where the project stands, on one page."
              lead="One command writes a self-contained HTML page from the repository's real state: settings, stack and commands, git, decision records, the current task, the AI activity ledger, and the docs. No server, no scripts, nothing estimated."
            />
            <div className="mt-8 max-w-[22rem]">
              <CommandLine command="/dashboard" />
            </div>
            <Link to="/docs/commands" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline">
              What it shows <IconArrowRight size={14} />
            </Link>
          </div>

          <figure className="panel overflow-hidden" aria-label="Example dashboard with sample values">
            <div className="flex items-center gap-2 border-b border-border bg-bg-sunken px-4 py-2.5">
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-border-strong" />
              <span className="ml-2 truncate font-mono text-xs text-fg-faint">.vz-skills/dashboard.html</span>
              <span className="ml-auto rounded-full border border-border px-2 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-fg-faint">example</span>
            </div>
            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {stats.map(([v, l, c]) => (
                  <div key={l} className="rounded-lg border border-border bg-bg-raised px-3 py-2">
                    <b className={`block truncate text-base font-semibold ${c ?? 'text-fg'}`}>{v}</b>
                    <span className="text-[0.6875rem] text-fg-faint">{l}</span>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-bg-raised p-3.5">
                  <p className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-fg-faint">Current task</p>
                  <p className="mt-1.5 text-sm font-medium text-fg">Rate limiting on /login</p>
                  <p className="mt-1 text-[0.8125rem] text-fg-muted">Next: write the metrics test in src/metrics.test.ts</p>
                  <ul className="mt-2 space-y-1 font-mono text-[0.75rem] text-fg-muted">
                    <li>S1 limiter <span className="text-ok">VERIFIED</span></li>
                    <li>S2 metrics <span className="text-warn">NOT VERIFIED</span></li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border bg-bg-raised p-3.5">
                  <p className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-fg-faint">Architecture decisions</p>
                  <ul className="mt-1.5 space-y-1.5 text-[0.8125rem]">
                    <li className="flex justify-between gap-2"><span className="truncate text-fg">0004 Redis for rate limits</span><span className="text-warn">Proposed</span></li>
                    <li className="flex justify-between gap-2"><span className="truncate text-fg">0003 Postgres for sessions</span><span className="text-ok">Accepted</span></li>
                    <li className="flex justify-between gap-2"><span className="truncate text-fg-muted">0002 In-memory sessions</span><span className="text-fg-faint">Superseded</span></li>
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-bg-raised p-3.5">
                <p className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-fg-faint">AI activity</p>
                <ul className="mt-1.5 space-y-1 font-mono text-[0.75rem] text-fg-muted">
                  <li><span className="text-fg-faint">12:07</span> <span className="text-danger">check failed</span> npm run lint</li>
                  <li><span className="text-fg-faint">12:05</span> <span className="text-ok">check passed</span> npm test -- limiter</li>
                  <li><span className="text-fg-faint">12:04</span> edit src/middleware/rate-limit.ts</li>
                </ul>
              </div>
            </div>
          </figure>
        </div>
      </Container>
    </Section>
  );
}
