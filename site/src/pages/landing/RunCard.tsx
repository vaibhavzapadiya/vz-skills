import { useEffect, useState, type ReactNode } from 'react';
import { Cat } from '@/components/Cat';
import { Label } from '@/components/Label';
import {
  IconCheck,
  IconCode,
  IconEye,
  IconFlask,
  IconLayers,
  IconListCheck,
  IconReplay,
  IconSearch,
  IconShieldCheck,
} from '@/components/Icons';
import { cn } from '@/lib/utils';
import { trackSpotlight } from '@/lib/spotlight';

/**
 * A replay of one task through the seven steps. The task, files and figures are the example used in
 * the project README (rate limiting on /login: 42 tests passed, lint blocked, one criterion not
 * verified). Labels are the plugin's own vocabulary.
 */
type Stage = { name: string; detail: string; icon: ReactNode; label?: string; note?: string };

const stages: Stage[] = [
  { name: 'Discover', detail: '4 commands found, format is UNKNOWN', icon: <IconSearch size={15} />, label: 'CONFIRMED' },
  { name: 'Clarify', detail: '2 acceptance criteria', icon: <IconListCheck size={15} />, note: 'risk high' },
  { name: 'Plan', detail: '2 slices, each with a test', icon: <IconLayers size={15} />, note: 'you approve' },
  { name: 'Build', detail: 'rateLimit.ts, login.ts', icon: <IconCode size={15} />, label: 'IMPLEMENTED' },
  { name: 'Test', detail: 'pnpm test: 42 passed, exit 0', icon: <IconFlask size={15} />, label: 'TESTED' },
  { name: 'Review', detail: 'security review: auth path', icon: <IconEye size={15} />, note: 'findings ranked' },
  { name: 'Verify', detail: 'lint BLOCKED, metrics NOT VERIFIED', icon: <IconShieldCheck size={15} />, note: 'report written' },
];
const TOTAL = stages.length;

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function useRun() {
  const [reduced] = useState(prefersReduced);
  const [step, setStep] = useState(reduced ? TOTAL : 0);

  useEffect(() => {
    if (reduced || step >= TOTAL) return;
    const t = window.setTimeout(() => setStep((s) => s + 1), step === 0 ? 900 : 700);
    return () => window.clearTimeout(t);
  }, [step, reduced]);

  return { step, reduced, replay: () => setStep(0) };
}

function Float({ children, className, show }: { children: ReactNode; className?: string; show: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute z-20 hidden items-center gap-2 rounded-full border border-border bg-bg-raised/95 py-1.5 pl-2 pr-3.5 text-xs text-fg shadow-md backdrop-blur transition-[opacity,transform] duration-slow ease-out xl:flex',
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
    >
      <span className="float-y flex items-center gap-2">{children}</span>
    </div>
  );
}

export function RunCard() {
  const { step, reduced, replay } = useRun();
  const done = step >= TOTAL;

  return (
    <figure onPointerMove={trackSpotlight} aria-label="A replay of one task through the seven steps" className="relative mx-auto w-full max-w-[34rem]">
      <Cat className="pointer-events-none absolute -top-[50px] right-8 z-10 sm:right-12" />

      <Float show={step >= 4} className="-top-3.5 left-6 border-ok/30">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-ok-soft text-ok">
          <IconCheck size={12} />
        </span>
        Uncommitted files untouched
      </Float>
      <Float show={step >= 5} className="-top-3.5 left-[16.5rem]">
        <span className="font-mono text-ok">42</span>
        tests passed
      </Float>

      <div
        className="rounded-[1.25rem] p-px shadow-lg"
        style={{
          backgroundImage:
            'linear-gradient(140deg, color-mix(in oklab, var(--accent) 50%, transparent), var(--border) 30%, var(--border) 68%, color-mix(in oklab, var(--ok) 40%, transparent))',
        }}
      >
        <div data-spot className="run-surface overflow-hidden rounded-[calc(1.25rem-1px)]">
          {/* header */}
          <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
            <p className="min-w-0 truncate font-mono text-[0.8125rem] text-fg">
              <span className="text-fg-faint">&gt; </span>add rate limiting to the login endpoint
              {!done && <span aria-hidden="true" className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-0.5 animate-pulse bg-accent" />}
            </p>
            <span className="shrink-0 font-mono text-[0.6875rem] tabular text-fg-muted">
              {Math.min(step, TOTAL)}/{TOTAL}
            </span>
          </div>
          <div className="mx-5 mt-4 h-px bg-border sm:mx-6">
            <div className="h-full origin-left bg-accent transition-transform duration-500 ease-out" style={{ transform: `scaleX(${step / TOTAL})` }} />
          </div>

          {/* timeline */}
          <ol className="px-5 py-3 sm:px-6">
            {stages.map((s, i) => {
              const isDone = i < step;
              const isCurrent = i === step;
              const last = i === TOTAL - 1;
              return (
                <li key={s.name} className={cn('relative grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5 transition-opacity duration-slow', !isDone && !isCurrent && 'opacity-45')}>
                  {!last && (
                    <span aria-hidden="true" className="absolute left-[0.8125rem] top-[calc(50%+0.9rem)] h-[calc(100%-0.2rem)] w-px bg-border">
                      <span
                        className="absolute inset-0 origin-top bg-ok/70 transition-transform duration-500 ease-out"
                        style={{ transform: `scaleY(${isDone ? 1 : 0})` }}
                      />
                    </span>
                  )}
                  <span
                    className={cn(
                      'relative z-10 grid h-7 w-7 place-items-center rounded-full border transition-colors duration-slow',
                      isDone && 'border-ok/40 bg-ok-soft text-ok',
                      isCurrent && 'pulse-ring border-accent bg-accent-soft text-accent-soft-fg',
                      !isDone && !isCurrent && 'border-border bg-bg-raised text-fg-faint',
                    )}
                  >
                    {isDone ? <IconCheck size={14} /> : s.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight text-fg">{s.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[0.6875rem] text-fg-muted">{s.detail}</p>
                  </div>
                  <span className={cn('flex justify-end transition-[opacity,transform] duration-slow', isDone ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0')}>
                    {s.label ? <Label size="xs">{s.label}</Label> : <span className="font-mono text-[0.625rem] uppercase tracking-[0.06em] text-fg-muted">{s.note}</span>}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* verdict */}
          <div className="flex items-center justify-between gap-3 border-t border-border bg-bg-sunken/50 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="eyebrow">Verdict</span>
              <span
                className={cn(
                  'inline-block rounded-sm border-2 border-warn px-2 py-0.5 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-warn',
                  done ? 'stamp-in -rotate-2' : 'opacity-0',
                )}
              >
                Done with limitations
              </span>
            </div>
            {!reduced && (
              <button
                type="button"
                onClick={replay}
                disabled={!done}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-fg-muted transition-colors duration-fast hover:bg-bg-raised hover:text-fg disabled:pointer-events-none disabled:opacity-40"
              >
                <IconReplay size={13} />
                Replay
              </button>
            )}
          </div>
        </div>
      </div>

      <figcaption className="mt-5 text-center text-xs leading-relaxed text-fg-faint">
        One task, replayed. The figures are the example from the README.
      </figcaption>
    </figure>
  );
}
