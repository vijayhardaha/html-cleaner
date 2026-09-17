/**
 * ==============================================================================
 * VITE CONFIG — Library Build (ESM + CJS)
 * ==============================================================================
 * Purpose: Build the library into dual formats (ESM/CJS) and emit type
 *          declarations. The CLI executable is built separately by
 *          `vitebin.config.ts` (single CJS bundle with a shebang).
 * Docs:    https://vite.dev/config/
 * ==============================================================================
 */

import { builtinModules } from 'node:module';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// -------------------------
// Externals
// -------------------------
// Node built-ins are resolved by the runtime. Runtime dependencies are bundled
// on purpose: unified, rehype-parse, rehype-stringify, and commander are
// ESM-only, so a CJS output that `require()`s them throws ERR_REQUIRE_ESM on
// Node 20. Bundling keeps both formats loadable everywhere.
const external = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

// -------------------------
// Build configuration
// -------------------------
export default defineConfig({
  build: {
    // No source maps in published output
    sourcemap: false,

    // Clean `dist/` before building (primary library build)
    emptyOutDir: true,

    target: 'node20',

    // Library mode: single entry, dual format output
    lib: {
      entry: 'src/index.ts',
      name: 'html-cleaner',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },

    rollupOptions: { external, output: { exports: 'named' } },

    outDir: 'dist',
  },

  // -------------------------
  // Plugins
  // -------------------------
  // Declarations are scoped to `src`: the shared tsconfig also covers tests and
  // build configs, and without this the plugin would write types/tests/** and
  // types/*.config.d.ts (the reference project deletes those in a postbuild
  // step; not generating them is cheaper and safer).
  plugins: [dts({ include: ['src'], insertTypesEntry: true, outDirs: 'types' })],
});
