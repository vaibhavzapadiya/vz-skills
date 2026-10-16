import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconAlert, IconBulb, IconInfo, IconList } from './Icons';

export type CalloutKind = 'note' | 'tip' | 'warning' | 'prereq';

const styles: Record<CalloutKind, { ring: string; icon: ReactNode; title: string }> = {
  note: { ring: 'border-accent/30 bg-accent-soft/60 [--callout-fg:var(--accent-soft-fg)]', icon: <IconInfo size={16} />, title: 'Note' },
  tip: { ring: 'border-ok/30 bg-ok-soft/70 [--callout-fg:var(--ok)]', icon: <IconBulb size={16} />, title: 'Tip' },
  warning: { ring: 'border-warn/35 bg-warn-soft/70 [--callout-fg:var(--warn)]', icon: <IconAlert size={16} />, title: 'Warning' },
  prereq: { ring: 'border-border-strong bg-bg-sunken [--callout-fg:var(--fg-muted)]', icon: <IconList size={16} />, title: 'Prerequisites' },
};

export function Callout({ kind = 'note', title, children, className }: { kind?: CalloutKind; title?: string; children: ReactNode; className?: string }) {
  const s = styles[kind];
  return (
    <aside role="note" className={cn('callout my-6 rounded-lg border px-4 py-3.5 text-[0.9375rem] leading-relaxed text-fg', s.ring, className)}>
      <div className="mb-1.5 flex items-center gap-2 font-medium text-[var(--callout-fg)]">
        {s.icon}
        <span>{title ?? s.title}</span>
      </div>
      <div className="text-fg/90 [&_a]:text-[var(--callout-fg)]">{children}</div>
    </aside>
  );
}
