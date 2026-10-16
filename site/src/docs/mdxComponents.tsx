import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { Link } from 'react-router';
import { CodeBlock } from '@/components/CodeBlock';
import { Callout } from '@/components/Callout';
import { Label } from '@/components/Label';
import { Tabs } from '@/components/Tabs';
import { cn, slugify, textOf } from '@/lib/utils';
import { IconLink } from '@/components/Icons';

export function Heading({ level, children }: { level: 2 | 3 | 4; children?: ReactNode }) {
  const id = slugify(textOf(children));
  const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
  return (
    <Tag id={id}>
      <a href={`#${id}`} className="heading-anchor" aria-label={`Link to ${textOf(children)}`}>
        <IconLink size={14} />
      </a>
      {children}
    </Tag>
  );
}

function parseMeta(meta?: string): { title?: string; lines: number[]; numbers: boolean } {
  if (!meta) return { lines: [], numbers: false };
  const title = /title="([^"]+)"/.exec(meta)?.[1];
  const hl = /\{([\d,-]+)\}/.exec(meta)?.[1];
  const lines: number[] = [];
  if (hl) {
    for (const part of hl.split(',')) {
      const [a, b] = part.split('-').map(Number);
      if (a && b) for (let i = a; i <= b; i++) lines.push(i);
      else if (a) lines.push(a);
    }
  }
  return { title, lines, numbers: /\bnumbers\b/.test(meta) };
}

/** MDX renders ```lang blocks as <pre><code class="language-x">; route them to CodeBlock. */
function Pre({ children }: ComponentProps<'pre'>) {
  const child = Children.toArray(children)[0];
  if (isValidElement(child)) {
    const el = child as ReactElement<{ className?: string; children?: ReactNode; 'data-meta'?: string }>;
    const lang = /language-([\w-]+)/.exec(el.props.className ?? '')?.[1];
    const meta = parseMeta(el.props['data-meta']);
    return <CodeBlock code={textOf(el.props.children)} language={lang ?? 'text'} title={meta.title} highlightLines={meta.lines} showLineNumbers={meta.numbers} className="my-6" />;
  }
  return <pre>{children}</pre>;
}

function Anchor({ href = '', children, ...rest }: ComponentProps<'a'>) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (href.startsWith('/')) return <Link to={href}>{children}</Link>;
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

function Table({ children }: ComponentProps<'table'>) {
  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Table, scrollable">
      <table>{children}</table>
    </div>
  );
}

/** <Steps> wraps an ordered list into numbered cards. */
function Steps({ children }: { children: ReactNode }) {
  return <div className="steps my-8 space-y-0 border-l border-border-strong pl-6 [counter-reset:step]">{children}</div>;
}
function Step({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative pb-8 last:pb-0 [counter-increment:step]">
      <span
        aria-hidden="true"
        className="absolute -left-[2.1875rem] top-0 flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-bg font-mono text-xs text-fg tabular before:content-[counter(step)]"
      />
      <h3 className="!mt-0 !mb-2 text-base font-semibold text-fg">{title}</h3>
      <div className="[&>*:first-child]:mt-0">{children}</div>
    </div>
  );
}

/** <Status word="CONFIRMED" /> inline evidence label. */
function Status({ word }: { word: string }) {
  return <Label size="xs">{word}</Label>;
}

function CodeTabs({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ label: string; children?: ReactNode }>[];
  return <Tabs className="my-6" tabs={items.map((c, i) => ({ id: `t${i}`, label: c.props.label, content: <div className="pt-4">{c.props.children}</div> }))} />;
}
function CodeTab({ children }: { label: string; children?: ReactNode }) {
  return <>{children}</>;
}

function Lead({ children }: { children: ReactNode }) {
  // MDX may wrap the text in its own <p>, so this must be a div.
  return <div className="lead">{children}</div>;
}

function Cards({ children }: { children: ReactNode }) {
  return <div className="not-prose my-8 grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Card({ to, title, children }: { to: string; title: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        'group rounded-lg border border-border bg-bg-raised p-5 shadow-sm transition-[border-color,box-shadow] duration-base hover:border-border-strong hover:shadow-md',
      )}
    >
      <p className="font-medium text-fg group-hover:text-accent">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{children}</p>
    </Link>
  );
}

export const mdxComponents = {
  h2: (p: ComponentProps<'h2'>) => <Heading level={2}>{p.children}</Heading>,
  h3: (p: ComponentProps<'h3'>) => <Heading level={3}>{p.children}</Heading>,
  h4: (p: ComponentProps<'h4'>) => <Heading level={4}>{p.children}</Heading>,
  pre: Pre,
  a: Anchor,
  table: Table,
  Callout,
  Steps,
  Step,
  Status,
  CodeTabs,
  CodeTab,
  Lead,
  Cards,
  Card,
};
