import { cn } from '@/lib/utils';

/**
 * A small cat that peeks over the top edge of a card. Original inline SVG, decorative only.
 * The bottom of the head sits on y=50; the paws hang a few pixels past it, so place the
 * element with its bottom edge on the card's top edge.
 */
export function Cat({ className }: { className?: string }) {
  const ink = '#2a241d';
  return (
    <svg
      viewBox="0 0 112 56"
      width="112"
      height="56"
      aria-hidden="true"
      focusable="false"
      className={cn('cat overflow-visible', className)}
    >
      {/* ears */}
      <g className="cat-ear cat-ear-l">
        <path d="M17 32 L15 4 L42 17 Z" fill="#f0b072" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M21 26 L20 11 L34 18 Z" fill="#f4a6a0" />
      </g>
      <g className="cat-ear cat-ear-r">
        <path d="M95 32 L97 4 L70 17 Z" fill="#f0b072" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M91 26 L92 11 L78 18 Z" fill="#f4a6a0" />
      </g>

      {/* head */}
      <path d="M10 50 C10 24 30 12 56 12 C82 12 102 24 102 50 Z" fill="#f0b072" />
      <path d="M10 50 C10 24 30 12 56 12 C82 12 102 24 102 50" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />

      {/* forehead stripes */}
      <path d="M56 13 V21 M48 14.5 L49.5 21 M64 14.5 L62.5 21" stroke="#d98f4e" strokeWidth="2.5" strokeLinecap="round" />

      {/* cheeks and muzzle */}
      <ellipse cx="29" cy="43" rx="7" ry="4.5" fill="#f4a6a0" opacity="0.55" />
      <ellipse cx="83" cy="43" rx="7" ry="4.5" fill="#f4a6a0" opacity="0.55" />
      <ellipse cx="56" cy="44" rx="12" ry="7" fill="#fff1dc" />

      {/* eyes */}
      <g className="cat-eye">
        <ellipse cx="38" cy="33" rx="4.2" ry="5.6" fill={ink} />
        <circle cx="39.6" cy="30.8" r="1.5" fill="#fff" />
      </g>
      <g className="cat-eye">
        <ellipse cx="74" cy="33" rx="4.2" ry="5.6" fill={ink} />
        <circle cx="75.6" cy="30.8" r="1.5" fill="#fff" />
      </g>

      {/* nose and mouth */}
      <path d="M52.5 39 H59.5 L56 43 Z" fill="#e58a8a" stroke={ink} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M56 43 V45 M56 45 Q52.5 48.5 49.5 46 M56 45 Q59.5 48.5 62.5 46" fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" />

      {/* whiskers */}
      <path d="M22 38 L5 34 M22 42 L5 43 M90 38 L107 34 M90 42 L107 43" stroke={ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />

      {/* paws on the edge */}
      <g stroke={ink} strokeWidth="2.2">
        <ellipse cx="38" cy="51" rx="9.5" ry="5.5" fill="#fff1dc" />
        <ellipse cx="74" cy="51" rx="9.5" ry="5.5" fill="#fff1dc" />
      </g>
      <path d="M35 49 V53 M41 49 V53 M71 49 V53 M77 49 V53" stroke={ink} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}
