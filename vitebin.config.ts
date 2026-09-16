/**
 * ==============================================================================
 * VITE BIN CONFIG — CLI Build (CJS)
 * ==============================================================================
 * Purpose: Build the CLI entry as a single CJS bundle and inject a shebang.
 *          Kept separate from `vite.config.ts` (library ESM build) so the
 *          executable can ship its own format, externals, and permissions.
 * Docs:    https://vite.dev/config/
 * ==============================================================================
 */

import { chmodSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { dirname, join, resolve } from 'node:path';

import type { NormalizedOutputOptions, OutputBundle, Plugin } from 'rolldown';
import { defineConfig } from 'vite';

// ------------------------------------------------------------------------------
// Externals
// ------------------------------------------------------------------------------
// Only Node built-ins stay external. Every runtime dependency (commander,
// unified, rehype-parse, rehype-stringify, property-information) is ESM-only,
// and Node 20 cannot `require()` ESM — so they must be inlined or the bundle
// throws ERR_REQUIRE_ESM at startup.
const NODE_BUILTINS = [...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)];

// ------------------------------------------------------------------------------
// Shebang injector plugin
// ------------------------------------------------------------------------------
/**
 * Prepend a shebang to every emitted CJS chunk and mark it executable.
 *
 * @param {string} [shebang] - Shebang line written at the top of the bundle.
 *
 * @returns {Plugin} Rollup plugin applying the shebang and file mode.
 */
const shebangPlugin = (shebang = '#!/usr/bin/env node'): Plugin => {
  return {
    name: 'shebang-inject',

    generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
      for (const fileName of Object.keys(bundle)) {
        const chunk = bundle[fileName];
        if (chunk && chunk.type === 'chunk' && fileName.endsWith('.cjs')) {
          // Drop any shebang carried over from the source entry so the
          // injected one is the only one in the output.
          chunk.code = `${shebang}\n${chunk.code.replace(/^#!.*(?:\r?\n)?/, '')}`;
        }
      }
    },

    writeBundle(options: NormalizedOutputOptions, bundle: OutputBundle) {
      const outputDir = options.dir ?? dirname(options.file ?? '.');

      for (const fileName of Object.keys(bundle)) {
        if (fileName.endsWith('.cjs')) {
          chmodSync(join(outputDir, fileName), 0o755);
        }
      }
    },
  };
};

// ------------------------------------------------------------------------------
// Vite config for CLI
// ------------------------------------------------------------------------------
export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve('.', 'src') } },

  // Vite externalizes node_modules for SSR builds, which would emit
  // `require('unified')` into a CJS file. Bundling them keeps the bin runnable.
  ssr: { noExternal: true },

  build: {
    // Single CJS output for the CLI
    lib: { entry: resolve('.', 'src/cli/index.ts'), formats: ['cjs'], fileName: () => 'cli/index.cjs' },

    // Node built-ins are resolved by the runtime; dependencies are bundled
    rollupOptions: {
      external: NODE_BUILTINS,
      output: { entryFileNames: 'cli/index.cjs', chunkFileNames: 'cli/[name].cjs' },
    },

    ssr: true,
    outDir: 'dist',
    sourcemap: false,
    minify: false,
    target: 'node20',

    // Don't empty dist here; primary library build empties it
    emptyOutDir: false,
  },

  plugins: [shebangPlugin()],
});
