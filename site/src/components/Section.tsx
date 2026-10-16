import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Container({ children, className, size = 'page' }: { children: ReactNode; className?: string; size?: 'page' | 'prose' | 'wide' }) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'page' && 'max-w-page',
        size === 'prose' && 'max-w-prose',
        size === 'wide' && 'max-w-[88rem]',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Editorial section heading: numbered eyebrow, serif title, measured lead.
 * The number gives the landing page a running order like a report's sections.
 */
export function SectionHeading({
  number,
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
  as: Tag = 'h2',
}: {
  number?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <div className={cn('max-w-[40rem]', align === 'center' && 'mx-auto text-center', className)}>
      <p className="eyebrow flex items-center gap-3">
        {number && <span className="tabular text-fg-faint">{number}</span>}
        {number && <span aria-hidden="true" className="h-px w-6 bg-border-strong" />}
        <span>{eyebrow}</span>
      </p>
      <Tag className="font-display mt-4 text-title text-fg [text-wrap:balance]">{title}</Tag>
      {lead && <p className="mt-4 text-[1.0625rem] leading-relaxed text-fg-muted [text-wrap:pretty]">{lead}</p>}
    </div>
  );
}

export function Section({ id, children, className, bleed }: { id?: string; children: ReactNode; className?: string; bleed?: boolean }) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-20 sm:py-24 lg:py-28', bleed && 'border-y border-border bg-bg-sunken/60', className)}>
      {children}
    </section>
  );
}
