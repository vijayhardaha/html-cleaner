/**
 * ========================================================================
 * Vite Configuration
 * ========================================================================
 * Purpose: Builds the html-cleaner library as Node.js ESM output for
 *          distribution and emits its declarations into `types/`. The CLI
 *          executable is built separately by `vitebin.config.ts` (single CJS
 *          bundle with a shebang).
 *          Declarations come from this Vite build rather than `tsc` because
 *          the shared tsconfig type-checks tests and build configs too, and
 *          TypeScript cannot emit for one part of a program only - running
 *          `tsc` for emit would produce `vite.config.d.ts` and friends.
 * Docs:    https://vite.dev/config/
 * ========================================================================
 */

import { builtinModules } from 'node:module';
import { resolve } from 'node:path';

import { dts } from 'rolldown-plugin-dts';
import { defineConfig } from 'vite';

const RUNTIME_EXTERNALS = ['commander', 'rehype-parse', 'rehype-stringify', 'unified'] as const;

const external = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`), ...RUNTIME_EXTERNALS];

export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve('.', 'src') } },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: false,
    target: 'node20',
    ssr: true,

    // Library entry point - produces dist/index.js (ESM)
    lib: { entry: { index: resolve('.', 'src/index.ts') } },

    rollupOptions: { external, output: [{ format: 'es', entryFileNames: '[name].js', chunkFileNames: '[name].js' }] },
  },

  // Library declarations only: `src` is the public surface, so tests and build
  // configs never contribute a .d.ts.
  plugins: [
    dts({
      entry: ['src/**/*.ts'],
      tsconfig: './tsconfig.json',
      compilerOptions: { declarationDir: 'types' },
      sourcemap: false,
    }),
  ],
});
