/**
 * ========================================================================
 * CommonJS bundle build script
 * ========================================================================
 * Purpose: Emits dist/index.cjs with all dependencies inlined. The unified
 *          ecosystem ships ESM only, so `require()` interop cannot load it:
 *          Node 20 has no `require(esm)` and newer Node mangles default
 *          exports through namespace wrapping. Inlining sidesteps both.
 * Usage:   Run via `bun run build:cjs`.
 * ========================================================================
 */

import { build } from 'esbuild';

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.cjs',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node20',
  sourcemap: true,
  minify: false,
  legalComments: 'none',
  logLevel: 'info',
});
