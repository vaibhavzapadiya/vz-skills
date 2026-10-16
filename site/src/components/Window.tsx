import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** A restrained terminal/window frame for product mockups. */
export function Window({ title, children, className, toolbar }: { title: string; children: ReactNode; className?: string; toolbar?: ReactNode }) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-border-code bg-bg-code text-fg-code shadow-lg', className)}>
      <div className="flex h-10 items-center justify-between gap-3 border-b border-border-code bg-bg-code-raised px-4">
        <div className="flex items-center gap-2 font-mono text-xs text-fg-code-muted">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[#5fcb8d]" />
          <span className="truncate">{title}</span>
        </div>
        {toolbar}
      </div>
      {children}
    </div>
  );
}
