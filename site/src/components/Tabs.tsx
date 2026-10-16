import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type Tab = { id: string; label: ReactNode; content: ReactNode; hint?: string };

/**
 * Accessible tabs: roving tabindex, arrow-key navigation, Home/End, automatic activation.
 */
export function Tabs({
  tabs,
  defaultTab,
  value,
  onChange,
  className,
  listClassName,
  variant = 'underline',
  'aria-label': ariaLabel,
}: {
  tabs: Tab[];
  defaultTab?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
  listClassName?: string;
  variant?: 'underline' | 'segmented';
  'aria-label'?: string;
}) {
  const [internal, setInternal] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const active = value ?? internal;
  const setActive = (id: string) => {
    setInternal(id);
    onChange?.(id);
  };
  const base = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const n = tabs.length;
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % n;
    else if (e.key === 'ArrowLeft') next = (index - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    setActive(tab.id);
    refs.current[next]?.focus();
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          variant === 'underline' && 'flex gap-1 overflow-x-auto overflow-y-hidden border-b border-border',
          variant === 'segmented' && 'inline-flex rounded-md border border-border bg-bg-sunken p-1',
          listClassName,
        )}
      >
        {tabs.map((t, i) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              id={`${base}-tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                'relative whitespace-nowrap text-sm font-medium transition-colors duration-fast',
                variant === 'underline' &&
                  cn(
                    '-mb-px border-b-2 px-3 py-2.5',
                    selected ? 'border-fg text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                  ),
                variant === 'segmented' &&
                  cn(
                    'rounded-sm px-3 py-1.5',
                    selected ? 'bg-bg-raised text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
                  ),
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`${base}-panel-${t.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={t.id !== active}
          tabIndex={0}
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          {t.id === active && t.content}
        </div>
      ))}
    </div>
  );
}
