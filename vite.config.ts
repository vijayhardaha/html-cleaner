/**
 * ========================================================================
 * Vite Configuration
 * ========================================================================
 * Purpose: Builds the html-cleaner library and CLI as Node.js ESM output
 *          for distribution.
 * Docs:    https://vite.dev/config/
 * ========================================================================
 */

import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve('.', 'src') } },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: 'node20',
    ssr: true,

    // Library entry point - produces dist/index.js
    lib: { entry: { index: resolve('.', 'src/index.ts') }, formats: ['es'] },

    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        'commander',
        'rehype-parse',
        'rehype-stringify',
        'unified',
      ],
      output: { entryFileNames: '[name].js', chunkFileNames: '[name].js' },
    },
  },
});
