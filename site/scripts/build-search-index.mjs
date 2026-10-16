// Builds src/docs/search-index.json from the MDX sources and the skill data, so search needs no runtime parsing.
// Usage: node scripts/build-search-index.mjs [--check]
// Requires Node 22.18+ (imports the TypeScript data file directly).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const contentDir = join(site, 'src', 'docs', 'content');
const out = join(site, 'src', 'docs', 'search-index.json');

const registry = readFileSync(join(site, 'src', 'docs', 'registry.ts'), 'utf8');
const pages = [...registry.matchAll(/page\('([^']*)',\s*'([^']*)',\s*'((?:[^'\\]|\\.)*)',\s*'[^']*',\s*\(\)\s*=>\s*import\('\.\/content\/([a-z-]+)\.mdx'\)/g)].map((m) => ({
  slug: m[1],
  title: m[2],
  description: m[3].replace(/\\'/g, "'"),
  file: m[4],
}));

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const strip = (md) =>
  md
    .replace(/^import .*$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/```\w*/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&#12[35];/g, (m) => (m === '&#123;' ? '{' : '}'))
    .replace(/[`*_>|#\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const path = (slug) => (slug ? `/docs/${slug}` : '/docs');
const entries = [];

for (const p of pages) {
  const src = readFileSync(join(contentDir, `${p.file}.mdx`), 'utf8').replace(/\r\n/g, '\n');
  let heading = p.title;
  let anchor = '';
  let buf = [];
  let code = false;
  let any = false;
  const flush = () => {
    const text = strip(buf.join('\n'));
    if (text) {
      entries.push({ slug: p.slug, page: p.title, heading, anchor, text, to: path(p.slug) + (anchor ? `#${anchor}` : '') });
      any = true;
    }
    buf = [];
  };
  for (const line of src.split('\n')) {
    if (line.startsWith('```')) code = !code;
    const m = !code && /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      heading = m[2].replace(/[`*]/g, '');
      anchor = slugify(m[2]);
    } else buf.push(line);
  }
  flush();
  if (!any) entries.push({ slug: p.slug, page: p.title, heading: p.title, anchor: '', text: p.description, to: path(p.slug) });
}

// The commands page is rendered from data; index each skill so "plan" or "verify" finds its entry.
const { skills } = await import(pathToFileURL(join(site, 'src', 'data', 'skills.ts')).href);
for (const s of skills) {
  entries.push({
    slug: 'commands',
    page: 'Commands',
    heading: s.name,
    anchor: s.name,
    text: `${s.command}${s.args ? ' ' + s.args : ''} ${s.description}`,
    to: `/docs/commands#${s.name}`,
  });
}

const next = JSON.stringify(entries, null, 1) + '\n';
if (process.argv.includes('--check')) {
  const cur = existsSync(out) ? readFileSync(out, 'utf8') : '';
  if (cur !== next) {
    console.error('search-index.json is stale; run: node scripts/build-search-index.mjs');
    process.exit(1);
  }
  console.log(`search-index.json is up to date (${entries.length} entries)`);
} else {
  writeFileSync(out, next);
  console.log(`wrote search-index.json (${entries.length} entries)`);
}
