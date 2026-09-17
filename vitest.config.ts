/**
 * ========================================================================
 * Vitest Configuration
 * ========================================================================
 * Purpose: Test runner config for unit tests with coverage.
 * Docs:    https://vitest.dev/config/
 * ========================================================================
 */

import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Shorthand for src/ imports
  resolve: { alias: { '@': resolve('.', 'src') } },

  // --- Tests Configs ---
  test: {
    // Node environment (no browser/DOM needed for CLI utils)
    environment: 'node',

    // Generous per-test budget: coverage instrumentation slows cold imports
    // of heavy config graphs past the 5s default under load spikes
    testTimeout: 20000,

    // Mocks console output to reduce test noise
    setupFiles: ['./vitest.setup.ts'],

    // Allow `describe`, `it`, `expect`, `vi` without imports
    globals: true,

    // Test file patterns
    include: ['**/*.test.{js,mjs,cjs,ts,tsx}', '**/*.spec.{js,mjs,cjs,ts,tsx}'],

    // V8-based coverage with text/JSON/HTML reports
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,mjs,cjs,ts,tsx}'],

      // Enforce the documented 100% target: vitest exits non-zero when any
      // metric in any file drops below it, instead of only printing numbers.
      thresholds: { statements: 100, branches: 100, functions: 100, lines: 100 },

      exclude: [
        'node_modules/',
        'vitest.config.mjs',
        'vitest.setup.mjs',
        '**/*.test.{js,mjs,cjs,ts,tsx}',
        '**/*.spec.{js,mjs,cjs,ts,tsx}',
        '**/dist/',
        '**/build/',
        'src/index.ts',
      ],
    },
  },
});
