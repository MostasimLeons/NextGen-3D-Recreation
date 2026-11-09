import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTE_TABLE, NOT_FOUND } from './src/pages/routeTable.js';

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** index.html with a route's own <title>, description and Open Graph tags. */
function withMeta(html, route) {
  const t = escapeHtml(route.title);
  const d = escapeHtml(route.description);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`);
}

/**
 * Deep links on any static host: after the build, write one HTML file per
 * route (dist/game-development/index.html …) with that route's metadata,
 * plus 404.html for unknown URLs. Hosts that support SPA rewrites can also
 * rewrite everything to /index.html — both work.
 */
function routePages() {
  let outDir = 'dist';
  return {
    name: 'nextgen-route-pages',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const html = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const route of ROUTE_TABLE) {
        if (route.path === '/') continue;
        const dir = join(outDir, route.path.slice(1));
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), withMeta(html, route));
      }
      writeFileSync(join(outDir, '404.html'), withMeta(html, NOT_FOUND));
    },
  };
}

export default defineConfig({
  plugins: [react(), routePages()],
  server: { port: 5174 },
  build: {
    rolldownOptions: {
      output: {
        // Long-cached vendor chunks shared by every page. R3F + drei are left
        // to the default splitting on purpose: grouping them pulled them into
        // the entry; ungrouped they stay lazy with the showcases.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/, priority: 30 },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 20 },
            { name: 'motion', test: /node_modules[\\/](gsap|postprocessing)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
