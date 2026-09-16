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

const RUNTIME_EXTERNALS = ['commander', 'rehype-parse', 'rehype-stringify', 'unified'] as const;

const external = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`), ...RUNTIME_EXTERNALS];

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

    // Library entry point - produces dist/index.js (ESM)
    // CLI entry point - produces dist/cli/index.js (ESM)
    lib: { entry: { index: resolve('.', 'src/index.ts'), 'cli/index': resolve('.', 'src/cli/index.ts') } },

    rollupOptions: { external, output: [{ format: 'es', entryFileNames: '[name].js', chunkFileNames: '[name].js' }] },
  },
});
