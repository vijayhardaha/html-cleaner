import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/** Built CLI bundle produced by `vite build --config vitebin.config.ts`. */
const BIN = fileURLToPath(new URL('../../dist/cli/index.cjs', import.meta.url));

/**
 * Create a `node_modules/.bin`-style symlink pointing at the built CLI.
 *
 * @returns {string} Absolute path to the symlink.
 */
function createBinSymlink(): string {
  const directory = mkdtempSync(join(tmpdir(), 'html-cleaner-bin-'));
  const link = join(directory, 'html-cleaner');

  symlinkSync(BIN, link);

  return link;
}

/**
 * Run the CLI bundle synchronously and capture its output.
 *
 * @param {string} target - Path or symlink to execute.
 * @param {string[]} args - Command-line arguments.
 * @param {string} [input] - Text piped to standard input.
 *
 * @returns {{ stdout: string; status: number | null }} Captured output and exit code.
 */
function runBin(target: string, args: string[], input = ''): { stdout: string; status: number | null } {
  const result = spawnSync(target, args, { input, encoding: 'utf8', timeout: 60_000 });

  if (result.error) {
    throw result.error;
  }

  return { stdout: result.stdout, status: result.status };
}

// Package managers run a bin through a symlink in node_modules/.bin. The entry-point guard
// must survive that, otherwise the installed CLI exits silently without doing anything.
describe.skipIf(!existsSync(BIN))('bin entry point', () => {
  it('reports the version when executed directly', () => {
    const { stdout, status } = runBin(BIN, ['--version']);

    expect(status).toBe(0);
    expect(stdout.trim()).toBe('0.1.0');
  });

  it('reports the version when executed through a bin symlink', () => {
    const { stdout, status } = runBin(createBinSymlink(), ['--version']);

    expect(status).toBe(0);
    expect(stdout.trim()).toBe('0.1.0');
  });

  it('cleans stdin when executed through a bin symlink', () => {
    const { stdout, status } = runBin(createBinSymlink(), ['--stdin'], '<div class="a"><p>x&nbsp;y</p></div>');

    expect(status).toBe(0);
    expect(stdout).toContain('<p>x y</p>');
  });
});
