import { useId, useState, type ReactNode } from 'react';
import { Cat } from '@/components/Cat';
import { Label } from '@/components/Label';
import { cn } from '@/lib/utils';
import { profileNames, type ProfileName } from '@/data/profiles';

/**
 * A completion report as the plugin would print it. The shape of each variant comes from
 * plugins/vz-skills/references/report-template.md (summary, evidence-table, full), selected by the
 * profile's response.final_report. The task and figures are the example from the project README.
 */

const format: Record<ProfileName, string> = {
  FAST: 'summary',
  BALANCED: 'evidence-table',
  PRODUCTION: 'full',
};

function Row({ i, children, className }: { i: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn('motion-safe:animate-fade-up', className)} style={{ animationDelay: `${i * 70}ms` }}>
      {children}
    </div>
  );
}

function Criterion({ n, status, text, evidence }: { n: number; status: string; text: string; evidence: string }) {
  return (
    <div className="grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 py-3">
      <span className="tabular pt-0.5 font-mono text-xs text-fg-faint">{n}</span>
      <div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Label size="xs">{status}</Label>
          <span className="text-sm text-fg">{text}</span>
        </div>
        <p className="mt-1.5 font-mono text-xs leading-relaxed text-fg-muted">{evidence}</p>
      </div>
    </div>
  );
}

function Section({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
      <span className="font-mono text-xs uppercase tracking-[0.06em] text-fg">{title}</span>
      <span className="text-[0.8125rem] leading-relaxed text-fg-muted">{hint}</span>
    </div>
  );
}

function Check({ cmd, result, status }: { cmd: string; result: string; status?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
      <code className="font-mono text-xs text-fg">{cmd}</code>
      {status && <Label size="xs">{status}</Label>}
      <span className="text-xs text-fg-muted">{result}</span>
    </div>
  );
}

const criteria = (
  <>
    <Row i={0} className="divide-y divide-border">
      <Criterion n={1} status="VERIFIED" text="/login returns 429 after 5 attempts per minute" evidence="pnpm test -- login.rate → 3 passed (exit 0)" />
    </Row>
    <Row i={1}>
      <Criterion n={2} status="NOT VERIFIED" text="Metrics emitted for rejected attempts" evidence="no test covers this; manual check not run" />
    </Row>
  </>
);

function Summary() {
  const lines: Array<[string, ReactNode]> = [
    ['Done', 'Rate limiting on /login, in two files.'],
    ['Checks', 'pnpm test → exit 0, 42 passed. pnpm run lint → BLOCKED: eslint not installed.'],
    ['Not verified', 'Metrics emitted for rejected attempts.'],
    ['Next', 'Add a metrics test, or check it by hand.'],
  ];
  return (
    <dl className="divide-y divide-border">
      {lines.map(([k, v], i) => (
        <Row key={k} i={i} className="grid gap-x-4 gap-y-0.5 py-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
          <dt className="font-mono text-xs uppercase tracking-[0.06em] text-fg-muted">{k}</dt>
          <dd className="text-sm leading-relaxed text-fg">{v}</dd>
        </Row>
      ))}
    </dl>
  );
}

function EvidenceTable() {
  return (
    <div>
      <p className="eyebrow pt-3">Acceptance criteria</p>
      <div className="divide-y divide-border">{criteria}</div>
      <Row i={2}>
        <p className="eyebrow border-t border-border pt-3">Checks run</p>
        <Check cmd="pnpm test" result="exit 0, 42 passed" />
        <Check cmd="pnpm run lint" status="BLOCKED" result="eslint not installed" />
      </Row>
      <Row i={3} className="flex items-baseline gap-3 border-t border-border py-3">
        <span className="eyebrow">Baseline</span>
        <span className="text-sm text-fg">clean</span>
      </Row>
    </div>
  );
}

function Full() {
  return (
    <div>
      <p className="eyebrow pt-3">Acceptance criteria</p>
      <div className="divide-y divide-border">{criteria}</div>
      <Row i={2} className="border-t border-border">
        <p className="eyebrow pt-3">Checks run</p>
        <Check cmd="pnpm test" result="exit 0, 42 passed" />
        <Check cmd="pnpm run lint" status="BLOCKED" result="eslint not installed" />
      </Row>
      <Row i={3} className="divide-y divide-border border-t border-border">
        <Section title="Scope and risk" hint="High: the path matches auth|login." />
        <Section title="Security review" hint="Findings by severity, or what was examined." />
        <Section title="Independent review" hint="The reviewer agent's findings and how each was resolved." />
        <Section title="Documentation" hint="What was updated, or why nothing needed to be." />
        <Section title="Rollback" hint="Revert the two files; no schema or config change." />
      </Row>
    </div>
  );
}

const views: Record<ProfileName, () => ReactNode> = { FAST: Summary, BALANCED: EvidenceTable, PRODUCTION: Full };

export function ReportCard() {
  const [profile, setProfile] = useState<ProfileName>('BALANCED');
  const name = useId();

  return (
    <figure className="relative mx-auto w-full max-w-[34rem] [filter:drop-shadow(0_18px_28px_rgb(26_25_21/0.12))] dark:[filter:drop-shadow(0_18px_28px_rgb(0_0_0/0.55))]">
      <Cat className="pointer-events-none absolute -top-[50px] right-8 z-10 sm:right-12" />
      <div className="receipt rounded-t-xl border border-b-0 border-border px-5 pt-5 sm:px-7 sm:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="eyebrow">Completion report</p>
            <p className="mt-2 font-mono text-[0.8125rem] leading-relaxed text-fg">
              <span className="text-fg-faint">&gt; </span>add rate limiting to the login endpoint
            </p>
          </div>
          <fieldset className="min-w-0">
            <legend className="sr-only">Profile</legend>
            <div className="inline-flex rounded-md border border-border bg-bg-sunken p-0.5">
              {profileNames.map((p) => (
                <label
                  key={p}
                  className="relative cursor-pointer rounded-[0.3rem] px-2.5 py-1 font-mono text-[0.6875rem] tracking-[0.04em] text-fg-muted transition-colors duration-fast hover:text-fg has-[:checked]:bg-bg-raised has-[:checked]:text-fg has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-ring"
                >
                  <input type="radio" name={name} value={p} checked={profile === p} onChange={() => setProfile(p)} className="sr-only" />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-4 border-t border-dashed border-border-strong" />

        {/* Keyed by profile so the rows animate in again when the format changes. */}
        <div key={profile} aria-live="polite">
          <p className="sr-only">Report format for {profile}: {format[profile]}.</p>
          {(() => {
            const View = views[profile];
            return <View />;
          })()}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border-strong py-4">
          <div className="font-mono text-xs text-fg-muted">
            response.final_report = <span className="text-fg">{format[profile]}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="eyebrow">Verdict</span>
            <span className="inline-block -rotate-2 rounded-sm border-2 border-warn px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-warn">
              Done with limitations
            </span>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="receipt-edge h-2.5" />
      <figcaption className="mt-5 text-center text-xs leading-relaxed text-fg-faint">
        Pick a profile. The shape comes from the plugin's report template; the example is from the README.
      </figcaption>
    </figure>
  );
}
