#!/usr/bin/env node
'use strict';
/**
 * Generate the animated terminal demo of the claim check: docs/assets/claim-check-demo.svg and a copy
 * for the website (site/public/claim-check-demo.svg).
 *
 *   node scripts/gen-demo-svg.js [--check]
 *
 * The animation re-enacts one exchange: Claude claims success without running a check, the claim
 * check hook sends it back with its real message (shortened where marked with an ellipsis), Claude
 * runs the test and reports the result. Pure SVG + CSS: no scripts and no external fonts, so it plays
 * in GitHub and npm READMEs and on the website. Honours prefers-reduced-motion (shows the end state).
 * --check exits 1 if the committed files differ from what this script would write.
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTS = [path.join(ROOT, 'docs', 'assets', 'claim-check-demo.svg'), path.join(ROOT, 'site', 'public', 'claim-check-demo.svg')];

const W = 820;
const PAD = 24;
const LH = 22; // line height
const TOP = 58; // first baseline
const CYCLE = 16; // seconds per loop
const FADE_OUT = 15.2; // everything fades before the loop restarts

const C = { bg: '#14141a', bar: '#1d1d25', fg: '#e6e6e0', dim: '#8b8b86', faint: '#5d5d59', accent: '#9aa8ff', ok: '#5fd38d', warn: '#e7b54a', warnBg: '#2a2312', okBg: '#12281b' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// [time it appears (s), x, text spans, optional kind]
// spans: [text, color, bold?]
const lines = [
  { t: 0.3, spans: [['> ', C.accent, true], ['fix the off-by-one in the parser', C.fg]], typed: true },
  { t: 2.4, spans: [['● ', C.accent], ['Update', C.fg, true], ['(src/parser.ts)', C.dim]] },
  { t: 2.9, spans: [['  ⎿  Updated src/parser.ts with 3 additions and 1 removal', C.dim]] },
  { t: 3.9, spans: [['● ', C.accent], ['Fixed the parser. All tests pass.', C.fg]] },
  { t: 5.2, kind: 'hook', spans: [['Stop hook ', C.warn, true], ['vz-skills claim check', C.warn]] },
  { t: 5.2, kind: 'hookbody', spans: [['your reply says "Fixed the parser", but no test, lint, typecheck, or build', C.fg]] },
  { t: 5.2, kind: 'hookbody', spans: [['command ran after the last code edit (src/parser.ts). Run the narrowest …', C.fg]] },
  { t: 7.4, spans: [['● ', C.accent], ['Bash', C.fg, true], ['(npm test -- parser)', C.dim]] },
  { t: 8.4, spans: [['  ⎿  ', C.dim], ['✓ ', C.ok], ['14 passed', C.ok], [' (exit 0)', C.dim]] },
  { t: 9.6, kind: 'final', spans: [['● ', C.accent], ['Fixed the parser. ', C.fg], ['npm test -- parser', C.accent], [' → 14 passed (exit 0)', C.fg]] },
];

// vertical layout: the hook block gets a box with a little extra room
let y = TOP;
for (const l of lines) {
  if (l.kind === 'hook') y += 10;
  l.y = y;
  y += LH;
  if (l.kind === 'hookbody' && lines[lines.indexOf(l) + 1] && lines[lines.indexOf(l) + 1].kind !== 'hookbody') y += 14;
}
const H = y + 34;

const pct = (s) => `${((s / CYCLE) * 100).toFixed(2)}%`;
const keyframes = [];
const css = [];
lines.forEach((l, i) => {
  const name = `l${i}`;
  const show = l.t;
  keyframes.push(`@keyframes ${name}{0%,${pct(Math.max(0, show - 0.01))}{opacity:0;transform:translateY(4px)}${pct(show + 0.35)},${pct(FADE_OUT)}{opacity:1;transform:none}${pct(FADE_OUT + 0.5)},100%{opacity:0;transform:none}}`);
  css.push(`.${name}{animation:${name} ${CYCLE}s linear infinite}`);
});
// typing effect for the prompt: a clip rectangle that grows
const typeEnd = 1.9;
keyframes.push(`@keyframes type{0%,${pct(0.3)}{width:0}${pct(typeEnd)},${pct(FADE_OUT)}{width:${W}px}${pct(FADE_OUT + 0.5)},100%{width:${W}px}}`);
keyframes.push(`@keyframes hookbox{0%,${pct(5.19)}{opacity:0}${pct(5.5)},${pct(FADE_OUT)}{opacity:1}${pct(FADE_OUT + 0.5)},100%{opacity:0}}`);
keyframes.push(`@keyframes badge{0%,${pct(10.2)}{opacity:0}${pct(10.6)},${pct(FADE_OUT)}{opacity:1}${pct(FADE_OUT + 0.5)},100%{opacity:0}}`);
keyframes.push('@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}');

const hookLines = lines.filter((l) => l.kind === 'hook' || l.kind === 'hookbody');
const boxTop = hookLines[0].y - 17;
const boxH = hookLines[hookLines.length - 1].y - boxTop + 10;
const final = lines.find((l) => l.kind === 'final');
// rough width of the final line in a 14px monospace font (0.6em per character)
const finalChars = final.spans.reduce((n, s) => n + [...s[0]].length, 0);
const badgeX = PAD + Math.round(finalChars * 8.4) + 12;

const text = (l) => `<text x="${PAD + (l.kind === 'hook' || l.kind === 'hookbody' ? 14 : 0)}" y="${l.y}">${l.spans.map(([t, c, b]) => `<tspan fill="${c}"${b ? ' font-weight="700"' : ''}>${esc(t)}</tspan>`).join('')}</text>`;

const body = lines.map((l, i) => (l.typed
  ? `<g class="l${i}"><g clip-path="url(#typed)">${text(l)}</g></g>`
  : `<g class="l${i}">${text(l)}</g>`)).join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
<title id="t">VZ Skills claim check</title>
<desc id="d">Illustration of a Claude Code session: Claude says "Fixed the parser. All tests pass." without running a test. The vz-skills claim check hook sends it back because no test ran after the last code edit. Claude runs npm test, 14 tests pass, and the final reply reports the command and result, labelled TESTED.</desc>
<defs><clipPath id="typed"><rect class="typing" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs>
<style>
text{font-family:ui-monospace,"Cascadia Code","SF Mono",Menlo,Consolas,"Liberation Mono",monospace;font-size:14px;white-space:pre}
${css.join('')}
.typing{animation:type ${CYCLE}s linear infinite}
.hookbox{animation:hookbox ${CYCLE}s linear infinite}
.badge{animation:badge ${CYCLE}s linear infinite}
.cursor{animation:blink 1s step-end infinite}
${keyframes.join('\n')}
@media (prefers-reduced-motion:reduce){g[class^="l"],.hookbox,.badge{animation:none;opacity:1}.typing{animation:none;width:${W}px}.cursor{animation:none}}
</style>
<rect width="${W}" height="${H}" rx="12" fill="${C.bg}"/>
<path d="M0 12a12 12 0 0 1 12-12h${W - 24}a12 12 0 0 1 12 12v18H0z" fill="${C.bar}"/>
<circle cx="22" cy="15" r="5.5" fill="#ff5f57"/><circle cx="40" cy="15" r="5.5" fill="#febc2e"/><circle cx="58" cy="15" r="5.5" fill="#28c840"/>
<text x="${W / 2}" y="20" text-anchor="middle" fill="${C.faint}" style="font-size:12px">claude  ·  vz-skills</text>
<rect class="hookbox" x="${PAD - 2}" y="${boxTop}" width="${W - 2 * PAD + 4}" height="${boxH}" rx="8" fill="${C.warnBg}" stroke="${C.warn}" stroke-opacity=".55"/>
  ${body}
<g class="badge"><rect x="${badgeX}" y="${final.y - 15}" width="64" height="20" rx="10" fill="${C.okBg}" stroke="${C.ok}" stroke-opacity=".6"/><text x="${badgeX + 32}" y="${final.y}" text-anchor="middle" fill="${C.ok}" style="font-size:11px;font-weight:700;letter-spacing:.06em">TESTED</text></g>
<text x="${PAD}" y="${H - 14}" fill="${C.faint}" style="font-size:11px">Illustration re-enacting the claim check hook's real message</text>
<rect class="cursor" x="${W - PAD - 8}" y="${H - 25}" width="8" height="14" fill="${C.dim}"/>
</svg>
`;

if (process.argv.includes('--check')) {
  const stale = OUTS.filter((f) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== svg);
  if (stale.length) { console.error(`stale: ${stale.map((f) => path.relative(ROOT, f)).join(', ')}; run node scripts/gen-demo-svg.js`); process.exit(1); }
  console.log('demo SVG is up to date');
} else {
  for (const f of OUTS) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, svg); console.log(`wrote ${path.relative(ROOT, f)} (${(svg.length / 1024).toFixed(1)} KB)`); }
}
