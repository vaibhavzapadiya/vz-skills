import { useCopy } from '@/lib/useCopy';
import { cn } from '@/lib/utils';
import { IconCheck, IconCopy } from './Icons';

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={() => void copy(text)}
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      data-copied={copied || undefined}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-sm px-2 font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-fg-code-muted transition-colors duration-fast hover:bg-white/[0.08] hover:text-fg-code focus-visible:outline-[var(--accent)]',
        copied && 'text-[#9ed6a5] hover:text-[#9ed6a5]',
        className,
      )}
    >
      {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}
