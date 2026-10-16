import { Highlight, type Language, type PrismTheme } from 'prism-react-renderer';
import { useMemo, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from './CopyButton';

/** Prism tokens mapped onto the site's code palette. */
const theme: PrismTheme = {
  plain: { color: 'var(--fg-code)', backgroundColor: 'transparent' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--fg-code-muted)', fontStyle: 'italic' } },
    { types: ['punctuation', 'operator'], style: { color: '#a7a399' } },
    { types: ['property', 'tag', 'constant', 'symbol', 'deleted'], style: { color: '#f2a1a1' } },
    { types: ['boolean', 'number'], style: { color: '#e2b04a' } },
    { types: ['selector', 'attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: '#9ed6a5' } },
    { types: ['atrule', 'attr-value', 'keyword'], style: { color: '#93a6ff' } },
    { types: ['function', 'class-name'], style: { color: '#e9d8a6' } },
    { types: ['regex', 'important', 'variable'], style: { color: '#f0b58a' } },
    { types: ['title'], style: { color: '#ffffff', fontWeight: '600' } },
  ],
};

const LABEL_RE = /\b(CONFIRMED|INFERRED|UNKNOWN|CONFLICTING|VERIFIED|NOT VERIFIED|TESTED|IMPLEMENTED|BLOCKED|NOT_RUN|PASS|FAIL|ask|deny)\b/g;

const labelColor: Record<string, string> = {
  CONFIRMED: '#9ed6a5',
  VERIFIED: '#9ed6a5',
  TESTED: '#9ed6a5',
  PASS: '#9ed6a5',
  INFERRED: '#e2b04a',
  'NOT VERIFIED': '#e2b04a',
  NOT_RUN: '#e2b04a',
  ask: '#e2b04a',
  UNKNOWN: '#a7a399',
  IMPLEMENTED: '#93a6ff',
  CONFLICTING: '#f2a1a1',
  BLOCKED: '#f2a1a1',
  FAIL: '#f2a1a1',
  deny: '#f2a1a1',
};

/** Plain-text output: emphasise the plugin's status vocabulary and bracketed evidence. */
function renderPlainLine(line: string, key: number) {
  const parts: ReactNode[] = [];
  let last = 0;
  const re = new RegExp(`${LABEL_RE.source}|(\\[[^\\]]+\\])|(^#{1,3} .*$)|(^\\$ .*$)`, 'gm');
  for (const m of line.matchAll(re)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push(line.slice(last, idx));
    const text = m[0];
    if (m[1]) parts.push(<span key={`${key}-${idx}`} style={{ color: labelColor[m[1]] ?? 'inherit', fontWeight: 600 }}>{text}</span>);
    else if (m[2]) parts.push(<span key={`${key}-${idx}`} style={{ color: 'var(--fg-code-muted)' }}>{text}</span>);
    else if (m[3]) parts.push(<span key={`${key}-${idx}`} style={{ color: '#ffffff', fontWeight: 600 }}>{text}</span>);
    else if (m[4]) parts.push(<span key={`${key}-${idx}`} style={{ color: '#93a6ff' }}>{text}</span>);
    last = idx + text.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts;
}

export type CodeBlockProps = {
  code: string;
  language?: string;
  title?: string;
  /** Hide the header bar (used for compact inline snippets). */
  bare?: boolean;
  className?: string;
  /** Lines to visually emphasise (1-based). */
  highlightLines?: number[];
  showLineNumbers?: boolean;
  /** Wrap long lines instead of scrolling horizontally. */
  wrap?: boolean;
};

const PRISM_LANGS = new Set(['bash', 'shell', 'sh', 'json', 'jsonc', 'yaml', 'yml', 'markdown', 'md', 'diff', 'javascript', 'js', 'typescript', 'ts', 'tsx', 'jsx', 'css', 'html', 'markup', 'python', 'go']);

function normaliseLang(lang?: string): { prism: Language | null; display: string } {
  const l = (lang ?? 'text').toLowerCase();
  if (l === 'sh' || l === 'shell') return { prism: 'bash', display: 'bash' };
  if (l === 'yml') return { prism: 'yaml', display: 'yaml' };
  if (l === 'md') return { prism: 'markdown', display: 'markdown' };
  if (l === 'jsonc') return { prism: 'json', display: 'json' };
  if (l === 'js') return { prism: 'javascript', display: 'js' };
  if (l === 'ts') return { prism: 'typescript', display: 'ts' };
  if (l === 'html') return { prism: 'markup', display: 'html' };
  if (PRISM_LANGS.has(l)) return { prism: l as Language, display: l };
  return { prism: null, display: l === 'text' ? 'output' : l };
}

export function CodeBlock({ code, language, title, bare, className, highlightLines = [], showLineNumbers, wrap }: CodeBlockProps) {
  const src = code.replace(/\n$/, '');
  const { prism, display } = normaliseLang(language);
  const lines = useMemo(() => src.split('\n'), [src]);
  const header = title ?? display;

  return (
    <figure
      className={cn(
        'group/code relative overflow-hidden rounded-lg border border-border-code bg-bg-code text-fg-code shadow-sm not-prose',
        className,
      )}
    >
      {!bare && (
        <figcaption className="flex h-9 items-center justify-between gap-3 border-b border-border-code bg-bg-code-raised px-3.5">
          <span className="truncate font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-fg-code-muted">{header}</span>
          <CopyButton text={src} label={`Copy ${title ?? 'code'}`} />
        </figcaption>
      )}
      {bare && (
        <div className="absolute right-2 top-2 z-10">
          <CopyButton text={src} label="Copy code" />
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className={cn('m-0 min-w-full px-4 py-3.5 font-mono text-[0.8125rem] leading-[1.65]', bare && 'pr-12', wrap && 'whitespace-pre-wrap break-words')}>
          {prism ? (
            <Highlight code={src} language={prism} theme={theme}>
              {({ tokens, getLineProps, getTokenProps }) => (
                <code className="block">
                  {tokens.map((line, i) => {
                    const { className: lc, ...lp } = getLineProps({ line });
                    return (
                      <span
                        key={i}
                        {...lp}
                        className={cn('block -mx-4 px-4', lc, highlightLines.includes(i + 1) && 'bg-white/[0.06]')}
                      >
                        {showLineNumbers && <span className="mr-4 inline-block w-5 select-none text-right text-fg-code-muted">{i + 1}</span>}
                        {line.map((token, k) => <span key={k} {...getTokenProps({ token })} />)}
                      </span>
                    );
                  })}
                </code>
              )}
            </Highlight>
          ) : (
            <code className="block">
              {lines.map((line, i) => (
                <span key={i} className={cn('block -mx-4 px-4', highlightLines.includes(i + 1) && 'bg-white/[0.06]')}>
                  {showLineNumbers && <span className="mr-4 inline-block w-5 select-none text-right text-fg-code-muted">{i + 1}</span>}
                  {renderPlainLine(line, i)}
                  {line === '' ? '​' : null}
                </span>
              ))}
            </code>
          )}
        </pre>
      </div>
    </figure>
  );
}

/** One-line shell command with a copy affordance, used for install snippets. */
export function CommandLine({ command, className }: { command: string; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border-code bg-bg-code pl-4 pr-2 text-fg-code shadow-sm',
        className,
      )}
    >
      <span aria-hidden="true" className="select-none font-mono text-sm text-fg-code-muted">
        $
      </span>
      <code className="flex-1 overflow-x-auto whitespace-nowrap py-3 font-mono text-sm">{command}</code>
      <CopyButton text={command} label="Copy install command" />
    </div>
  );
}
