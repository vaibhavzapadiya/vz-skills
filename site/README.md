# VZ Toolkit website

Landing page and documentation for the VZ Toolkit plugin (installed as `vz-skills`). Vite, React 19, TypeScript, Tailwind CSS 4, React Router, MDX. Requires Node.js 22.18 or later (the search-index script imports a TypeScript data file directly).

```bash
cd site
npm install
npm run dev        # http://localhost:5173
npm run verify     # regenerate changelog and search index, typecheck, content checks, production build
npm run preview    # serve dist/ on http://localhost:4173
```

## Layout

| Path | Purpose |
|---|---|
| `src/styles/global.css` | Design tokens (colour, type, radius, shadow, motion), light and dark themes, prose styles, the `panel` surface |
| `src/components/` | Reusable UI: buttons, labels, code blocks, callouts, tabs, accordion, header, footer, search dialog, table of contents |
| `src/pages/Landing.tsx`, `src/pages/landing/` | Landing page, one file per section |
| `src/pages/DocsLayout.tsx` | Documentation shell: sidebar, breadcrumbs, table of contents, previous/next, search |
| `src/docs/registry.ts` | Ordered list of documentation pages; drives the sidebar, routing, and previous/next |
| `src/docs/content/*.mdx` | Documentation pages. `changelog.mdx` is generated from the repository's `CHANGELOG.md` |
| `src/data/` | Values copied from the plugin: skill list, profile matrix, sample output |
| `scripts/` | `verify-content.mjs`, `sync-changelog.mjs`, `build-search-index.mjs`, `postbuild.mjs` |

## Keeping it accurate

Nothing on the site is invented. Values come from the plugin's own files and script output.

`npm run check` compares the site with the plugin and fails on a mismatch:

- the skill list and commands against `plugins/vz-skills/skills/`
- agent and hook counts against `agents/` and `hooks/hooks.json`
- the plugin version against `plugin.json`
- the profile matrix against `vz-config.js --profiles`
- configuration keys against `vz-config.js --schema`
- every internal docs link and heading anchor
- that the generated changelog page and search index are current

After changing the plugin, update `src/data/` and the relevant MDX page, then run `npm run verify`.

## Documentation components

Available inside MDX without imports: `Lead`, `Callout` (`note`, `tip`, `warning`, `prereq`), `Steps` and `Step`, `Status` (an evidence label), `CodeTabs` and `CodeTab`, `Cards` and `Card`. Fenced code blocks support `title="..."`, line highlights such as `{2-4}`, and `numbers`.

## Deploying

`npm run build` writes a static site to `dist/` and copies `index.html` to `404.html` so deep links work on hosts that serve a 404 page for unknown paths. To serve from a sub-path, set `VITE_BASE`, for example `VITE_BASE=/vz-skills/ npm run build`.

The site is deployed to Cloudflare Workers as an assets-only Worker named `vz-skills` (`wrangler.jsonc`). Unknown paths return `index.html` (`not_found_handling: single-page-application`) so React Router handles deep links.

```bash
npx wrangler login   # once, in a browser
npm run deploy       # build, then wrangler deploy
```

Deploys also happen automatically: `.github/workflows/deploy-site.yml` runs after the `ci` workflow passes on `main`, checks out the exact commit CI tested, runs `npm run verify`, and deploys with `cloudflare/wrangler-action` (wrangler 4.136.1). It can also be started by hand from the Actions tab. It needs a repository secret `CLOUDFLARE_API_TOKEN` (a Cloudflare API token made from the "Edit Cloudflare Workers" template) and a repository variable `CLOUDFLARE_ACCOUNT_ID`; without the token it skips the deploy with a notice.
