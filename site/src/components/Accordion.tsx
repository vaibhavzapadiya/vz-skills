import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { IconChevronDown } from './Icons';

/**
 * Disclosure list built on native <details>, so it is keyboard-accessible and works without JS.
 */
export function Accordion({ items, className }: { items: Array<{ id: string; question: ReactNode; answer: ReactNode }>; className?: string }) {
  return (
    <div className={cn('divide-y divide-border border-y border-border', className)}>
      {items.map((it) => (
        <details key={it.id} id={it.id} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-[1.0625rem] font-medium text-fg marker:content-none [&::-webkit-details-marker]:hidden hover:text-accent transition-colors duration-fast">
            <span>{it.question}</span>
            <IconChevronDown
              size={18}
              className="mt-1 shrink-0 text-fg-faint transition-transform duration-base ease-out group-open:rotate-180"
            />
          </summary>
          <div className="pb-6 pr-10 text-[0.9375rem] leading-relaxed text-fg-muted [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded-xs [&_code]:border [&_code]:border-border [&_code]:bg-bg-sunken [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-fg [&_p+p]:mt-3">
            {it.answer}
          </div>
        </details>
      ))}
    </div>
  );
}
