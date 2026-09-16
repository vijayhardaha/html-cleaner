/**
 * ========================================================================
 * Vite Configuration
 * ========================================================================
 * Purpose: Builds the CLI as a Node.js library (ESM format) for distribution.
 * Docs:    https://vitejs.dev/config/
 * ========================================================================
 */

import { builtinModules } from 'module';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve('.', 'src') } },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: true,
    target: 'node18',
    ssr: true,

    // CLI entry point - produces dist/vdo.js
    lib: { entry: resolve('.', 'src/bin/vdo.ts'), name: 'vdo', fileName: 'vdo', formats: ['es'] },

    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        'commander',
        'cli-progress',
        'axios',
        'is-unicode-supported',
        'yoctocolors',
      ],
      output: { preserveModules: false, entryFileNames: '[name].js' },
    },
  },
});
