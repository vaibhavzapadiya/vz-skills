import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Evidence labels are the plugin's vocabulary. Colour is reinforced by the literal
 * word, so meaning never depends on colour alone.
 */
export type Tone = 'ok' | 'warn' | 'danger' | 'neutral' | 'accent';

export const toneClass: Record<Tone, string> = {
  ok: 'bg-ok-soft text-ok border-ok/25',
  warn: 'bg-warn-soft text-warn border-warn/25',
  danger: 'bg-danger-soft text-danger border-danger/25',
  neutral: 'bg-neutral-soft text-neutral border-neutral/25',
  accent: 'bg-accent-soft text-accent-soft-fg border-accent/25',
};

/** Map a status word used by the plugin to a tone. */
export function toneFor(word: string): Tone {
  switch (word.toUpperCase()) {
    case 'CONFIRMED':
    case 'VERIFIED':
    case 'TESTED':
    case 'PASS':
    case 'OK':
      return 'ok';
    case 'INFERRED':
    case 'NOT VERIFIED':
    case 'ASK':
      return 'warn';
    case 'CONFLICTING':
    case 'BLOCKED':
    case 'FAIL':
    case 'DENY':
      return 'danger';
    case 'IMPLEMENTED':
    case 'SILENT':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function Label({ children, tone, className, size = 'sm' }: { children: ReactNode; tone?: Tone; className?: string; size?: 'xs' | 'sm' }) {
  const t = tone ?? (typeof children === 'string' ? toneFor(children) : 'neutral');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-xs border font-mono font-medium uppercase tracking-[0.06em] whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-px text-[0.625rem] leading-4' : 'px-2 py-0.5 text-[0.6875rem] leading-4',
        toneClass[t],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small neutral chip for metadata such as "Auto" or "You". */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-border bg-bg-raised px-2 py-0.5 text-xs text-fg-muted whitespace-nowrap', className)}>
      {children}
    </span>
  );
}
