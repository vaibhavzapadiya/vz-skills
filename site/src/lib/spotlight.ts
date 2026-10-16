import type { PointerEvent } from 'react';

/**
 * Pointer light: on a mouse move over a container, set --mx/--my on every descendant marked
 * with data-spot, relative to that element. The glow itself is CSS (see [data-spot] in global.css).
 */
export function trackSpotlight(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== 'mouse') return;
  for (const el of e.currentTarget.querySelectorAll<HTMLElement>('[data-spot]')) {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
}
