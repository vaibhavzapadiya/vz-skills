// Checks the site's claims against the plugin's own files. Exits 1 on any mismatch.
// Run: node scripts/verify-content.mjs   (from site/)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const repo = join(site, '..');
const plugin = join(repo, 'plugins', 'vz-skills');
const problems = [];
const fail = (m) => problems.push(m);
const read = (p) => readFileSync(p, 'utf8');

/** Pull simple literals out of the TypeScript data files without compiling them. */
const skillsTs = read(join(site, 'src', 'data', 'skills.ts'));
const profilesTs = read(join(site, 'src', 'data', 'profiles.ts'));
const utilsTs = read(join(site, 'src', 'lib', 'utils.ts'));
const registryTs = read(join(site, 'src', 'docs', 'registry.ts'));

// 1. Skills: the plugin's own scan (scripts/lib/skills.js) is the source of truth, including group folders.
const require = createRequire(import.meta.url);
const { listSkills } = require(join(plugin, 'scripts', 'lib', 'skills.js'));
const scan = listSkills(plugin);
for (const u of scan.unreachable) fail(`plugin: skill ${u.name} is not reachable (${u.reason})`);
const onDisk = scan.skills.map((x) => x.name).sort();
const dataSkills = [...skillsTs.matchAll(/\{\n\s+name: '([a-z-]+)',\n\s+command: '([^']+)',[\s\S]*?group: '([a-z]+)'/g)].map((m) => ({ name: m[1], command: m[2], group: m[3] }));
if (dataSkills.length !== onDisk.length) fail(`skills: data has ${dataSkills.length}, plugin has ${onDisk.length}`);
for (const sk of scan.skills) {
  const d = dataSkills.find((x) => x.name === sk.name);
  if (!d) {
    fail(`skills: ${sk.name} missing from site/src/data/skills.ts`);
    continue;
  }
  if (d.group !== sk.group) fail(`skills: ${sk.name} is in group "${sk.group}" in the plugin but "${d.group}" on the site`);
  const expected = sk.name === 'status' ? '/vz-status' : `/${sk.name}`;
  if (d.command !== expected) fail(`skills: command for ${sk.name} is ${d.command}, expected ${expected}`);
}
for (const d of dataSkills) if (!onDisk.includes(d.name)) fail(`skills: ${d.name} in site data but not in plugin`);
const siteGroups = [...skillsTs.matchAll(/\{ id: '([a-z]+)', title: '/g)].map((m) => m[1]);
const pluginGroups = scan.groups.map((g) => g.name);
for (const g of pluginGroups) if (!siteGroups.includes(g)) fail(`skill groups: plugin group "${g}" has no section on the site`);
for (const g of siteGroups) if (!pluginGroups.includes(g)) fail(`skill groups: site group "${g}" is not a plugin folder`);

// 2. Counts in SITE constant.
const counts = (k) => Number(new RegExp(`${k}: (\\d+)`).exec(utilsTs)?.[1]);
const agentsOnDisk = readdirSync(join(plugin, 'agents')).filter((f) => f.endsWith('.md')).length;
const hooksJson = JSON.parse(read(join(plugin, 'hooks', 'hooks.json')));
const hookCount = Object.values(hooksJson.hooks).reduce((n, arr) => n + arr.reduce((m, g) => m + g.hooks.length, 0), 0);
if (counts('skills') !== onDisk.length) fail(`SITE.counts.skills=${counts('skills')} but plugin has ${onDisk.length}`);
if (counts('agents') !== agentsOnDisk) fail(`SITE.counts.agents=${counts('agents')} but plugin has ${agentsOnDisk}`);
if (counts('hooks') !== hookCount) fail(`SITE.counts.hooks=${counts('hooks')} but hooks.json declares ${hookCount}`);

// 3. Version.
const pluginVersion = JSON.parse(read(join(plugin, '.claude-plugin', 'plugin.json'))).version;
const siteVersion = /version: '([^']+)'/.exec(utilsTs)?.[1];
if (siteVersion !== pluginVersion) fail(`SITE.version=${siteVersion} but plugin.json says ${pluginVersion}`);

// 4. Profile matrix == `vz-config.js --profiles` output.
const prof = spawnSync(process.execPath, [join(plugin, 'scripts', 'vz-config.js'), '--profiles'], { encoding: 'utf8' });
if (prof.status !== 0) fail('vz-config.js --profiles failed');
else {
  const live = new Map();
  for (const line of prof.stdout.split('\n')) {
    const cols = line.trim().split(/\s+/);
    if (cols.length === 4 && cols[0] !== 'key') live.set(cols[0], cols.slice(1));
  }
  const rows = [...profilesTs.matchAll(/\{ key: '([^']+)', FAST: '([^']+)', BALANCED: '([^']+)', PRODUCTION: '([^']+)'/g)];
  if (rows.length !== live.size) fail(`profile matrix: site has ${rows.length} rows, plugin has ${live.size}`);
  for (const [, key, f, b, p] of rows) {
    const l = live.get(key);
    if (!l) fail(`profile matrix: ${key} not in plugin output`);
    else if (l[0] !== f || l[1] !== b || l[2] !== p) fail(`profile matrix: ${key} differs (site ${f}/${b}/${p}, plugin ${l.join('/')})`);
  }
}

// 5. Config keys documented on the configuration page exist in the plugin schema, and vice versa.
const schemaProc = spawnSync(process.execPath, [join(plugin, 'scripts', 'vz-config.js'), '--schema'], { encoding: 'utf8' });
if (schemaProc.status === 0) {
  let keys = [];
  try {
    const parsed = JSON.parse(schemaProc.stdout);
    keys = parsed.map((e) => e.key);
  } catch {
    fail('could not parse vz-config.js --schema output');
  }
  const doc = read(join(site, 'src', 'docs', 'content', 'configuration.mdx'));
  for (const k of keys) if (k.includes('.') || k === 'version' || k === 'profile') if (!doc.includes(`\`${k}\``)) fail(`configuration page is missing key ${k}`);
  const documented = [...doc.matchAll(/^\| `([a-z_]+(?:\.[a-z_]+)*)` \|/gm)].map((m) => m[1]);
  for (const k of documented) if (keys.length && !keys.includes(k)) fail(`configuration page documents unknown key ${k}`);
}

// 6. Docs registry: every page has a content file; every content file is registered.
const slugs = [...registryTs.matchAll(/page\('([^']*)',[^]*?import\('\.\/content\/([a-z-]+)\.mdx'\)/g)].map((m) => ({ slug: m[1], file: m[2] }));
const contentDir = join(site, 'src', 'docs', 'content');
const files = readdirSync(contentDir).filter((f) => f.endsWith('.mdx')).map((f) => f.replace('.mdx', ''));
for (const s of slugs) if (!files.includes(s.file)) fail(`registry: ${s.slug || '(index)'} -> missing content/${s.file}.mdx`);
for (const f of files) if (!slugs.some((s) => s.file === f)) fail(`content/${f}.mdx is not registered`);

// 7. Internal links in MDX and TSX resolve to a registered page and, if present, an existing heading.
const slugify = (t) => t.toLowerCase().trim().replace(/[`*_~]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const headingsFor = (file) => {
  const p = join(contentDir, `${file}.mdx`);
  if (!existsSync(p)) return new Set();
  const out = new Set();
  let code = false;
  for (const line of read(p).split('\n')) {
    if (line.startsWith('```')) code = !code;
    const m = !code && /^#{2,4}\s+(.*)$/.exec(line);
    if (m) out.add(slugify(m[1]));
  }
  return out;
};
const slugToFile = new Map(slugs.map((s) => [s.slug, s.file]));
const scanLinks = (label, text) => {
  for (const m of text.matchAll(/(?:\]\(|to="|to=\{`|href=")(\/docs[^)"`]*)/g)) {
    const [pathPart, hash] = m[1].split('#');
    const slug = (pathPart ?? '').replace(/^\/docs\/?/, '');
    if (!slugToFile.has(slug)) {
      fail(`${label}: link to unknown docs page ${m[1]}`);
      continue;
    }
    if (hash) {
      const file = slugToFile.get(slug);
      const generated = new Set(['commands']); // headings come from data, checked below
      if (!generated.has(file) && !headingsFor(file).has(hash)) fail(`${label}: ${m[1]} -> no heading "${hash}"`);
    }
  }
};
for (const f of files) scanLinks(`content/${f}.mdx`, read(join(contentDir, `${f}.mdx`)));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
for (const f of walk(join(site, 'src')).filter((p) => p.endsWith('.tsx') || p.endsWith('.ts'))) scanLinks(f.replace(site, 'site'), read(f));

// 8. Install commands and flags quoted on the site exist in the CLI.
const cli = read(join(repo, 'bin', 'vz-skills.js'));
for (const word of ['install', 'update', 'uninstall', 'try', 'doctor', 'path', 'validate', '--flat', '--scope', '--purge', '--force']) {
  if (!cli.includes(word)) fail(`CLI no longer mentions "${word}", which the site documents`);
}

// 9a. Search index is current.
const si = spawnSync(process.execPath, [join(here, 'build-search-index.mjs'), '--check'], { encoding: 'utf8' });
if (si.status !== 0) fail('search-index.json is stale (run node scripts/build-search-index.mjs)');

// 9. Changelog page is generated and current.
const cl = spawnSync(process.execPath, [join(here, 'sync-changelog.mjs'), '--check'], { encoding: 'utf8' });
if (cl.status !== 0) fail('changelog.mdx is stale (run node scripts/sync-changelog.mjs)');

if (problems.length) {
  console.error(`verify-content: ${problems.length} problem(s)\n` + problems.map((p) => ` - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`verify-content: ok (${onDisk.length} skills, ${agentsOnDisk} agents, ${hookCount} hooks, ${slugs.length} docs pages, version ${pluginVersion})`);
