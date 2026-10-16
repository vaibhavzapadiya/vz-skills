// Copy index.html to 404.html so static hosts that serve 404.html for unknown paths
// (GitHub Pages, for example) still load the single-page app for deep links.
import { copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const index = join(dist, 'index.html');
if (!existsSync(index)) {
  console.error('postbuild: dist/index.html not found; run vite build first');
  process.exit(1);
}
copyFileSync(index, join(dist, '404.html'));
console.log('postbuild: wrote dist/404.html');
