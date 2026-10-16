import { cn } from '@/lib/utils';

/**
 * Wordmark: a square "VZ" monogram built from two strokes that meet,
 * echoing a check mark. Pure SVG so it inherits currentColor.
 */
export function LogoMark({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="7" className="fill-fg" />
      <path d="M8 10.5 13.2 22 18 10.5" className="stroke-bg" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M17.5 10.5H25l-6.5 11.5H26" className="stroke-bg" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-semibold tracking-[-0.01em] text-fg', className)}>
      <LogoMark />
      <span>
        VZ <span className="text-fg-muted font-medium">Toolkit</span>
      </span>
    </span>
  );
}
