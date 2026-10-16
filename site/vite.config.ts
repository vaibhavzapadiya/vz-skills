import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';
import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'unified';
import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Carry a fenced code block's meta string (```bash title="x") through to the
 * rendered <code> element so the CodeBlock component can read it.
 */
const rehypeCodeMeta: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName !== 'code') return;
    const meta = (node.data as { meta?: string } | undefined)?.meta;
    if (meta) node.properties = { ...node.properties, 'data-meta': meta };
  });
};

// VITE_BASE lets the same build be served from a sub-path (for example a project page).
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    { enforce: 'pre', ...mdx({ include: /\.mdx$/, remarkPlugins: [remarkGfm], rehypePlugins: [rehypeCodeMeta], providerImportSource: '@mdx-js/react' }) },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          prism: ['prism-react-renderer'],
        },
      },
    },
  },
});
