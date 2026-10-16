import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type Item = { id: string; text: string; level: 2 | 3 };

/** Reads h2/h3 from the rendered article and highlights the one in view. */
export function Toc({ containerId, deps }: { containerId: string; deps: unknown }) {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    let raf = 0;
    let tries = 0;
    const collect = () => {
      const root = document.getElementById(containerId);
      const heads = root ? Array.from(root.querySelectorAll<HTMLHeadingElement>('h2[id], h3[id]')) : [];
      if (!heads.length && tries++ < 30) {
        raf = requestAnimationFrame(collect);
        return;
      }
      setItems(heads.map((h) => ({ id: h.id, text: h.textContent ?? '', level: h.tagName === 'H2' ? 2 : 3 })));
      setActive(heads[0]?.id ?? '');
    };
    setItems([]);
    collect();
    return () => cancelAnimationFrame(raf);
  }, [containerId, deps]);

  useEffect(() => {
    if (!items.length) return;
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -65% 0px', threshold: 0 },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [items]);

  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="eyebrow mb-3">On this page</p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              aria-current={active === i.id ? 'location' : undefined}
              className={cn(
                '-ml-px block border-l py-1 leading-snug transition-colors duration-fast',
                i.level === 2 ? 'pl-3' : 'pl-6 text-[0.8125rem]',
                active === i.id ? 'border-fg font-medium text-fg' : 'border-transparent text-fg-muted hover:border-border-strong hover:text-fg',
              )}
            >
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
