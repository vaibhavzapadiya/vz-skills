import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { loadIndex, search, type SearchEntry } from '@/docs/search';
import { cn } from '@/lib/utils';
import { IconCornerDownLeft, IconSearch } from './Icons';

function Mark({ text, query }: { text: string; query: string }) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return (
    <>
      {text.split(re).map((part, i) =>
        terms.includes(part.toLowerCase()) ? (
          <mark key={i} className="rounded-xs bg-accent-soft px-0.5 text-accent-soft-fg">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    loadIndex().then(setIndex).catch(() => setFailed(true));
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const hits = useMemo(() => (index ? search(index, query) : []), [index, query]);
  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(0, hits.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      const h = hits[active];
      if (h) {
        e.preventDefault();
        go(h.entry.to);
      }
    } else if (e.key === 'Tab') {
      // Keep focus inside the dialog: only the input is focusable.
      e.preventDefault();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-bg-inverse/40 backdrop-blur-[2px] motion-safe:animate-fade-in" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Search documentation" className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border-strong bg-bg-raised shadow-lg motion-safe:animate-fade-up">
        <div className="flex items-center gap-3 border-b border-border px-4">
          <IconSearch size={18} className="text-fg-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={hits[active] ? `${listId}-${active}` : undefined}
            aria-autocomplete="list"
            placeholder="Search the documentation"
            className="h-14 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-faint"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="rounded-xs border border-border bg-bg-sunken px-1.5 py-px font-mono text-[0.6875rem] text-fg-faint">Esc</kbd>
        </div>
        <ul id={listId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
          {failed && <li className="px-3 py-6 text-center text-sm text-danger">The search index could not be loaded.</li>}
          {!failed && !index && <li className="px-3 py-6 text-center text-sm text-fg-faint">Loading index…</li>}
          {index && !query.trim() && (
            <li className="px-3 py-6 text-center text-sm text-fg-faint">
              Type to search {index.length} sections across the docs. Try “baseline”, “safety floor”, or “flat”.
            </li>
          )}
          {index && query.trim() && hits.length === 0 && <li className="px-3 py-6 text-center text-sm text-fg-muted">No results for “{query}”.</li>}
          {hits.map((h, i) => (
            <li key={h.entry.to + i} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h.entry.to)}
                className={cn('flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left', i === active ? 'bg-bg-sunken' : 'hover:bg-bg-sunken')}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">
                    <Mark text={h.entry.heading} query={query} />
                  </span>
                  <span className="block truncate font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-fg-faint">{h.entry.page}</span>
                  <span className="mt-1 line-clamp-2 block text-[0.8125rem] leading-snug text-fg-muted">
                    <Mark text={h.snippet} query={query} />
                  </span>
                </span>
                {i === active && <IconCornerDownLeft size={14} className="mt-1 shrink-0 text-fg-faint" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[0.6875rem] text-fg-faint">
          <span>↑ ↓ to move · Enter to open</span>
          <span aria-live="polite">{index && query.trim() ? `${hits.length} result${hits.length === 1 ? '' : 's'}` : ''}</span>
        </div>
      </div>
    </div>
  );
}
