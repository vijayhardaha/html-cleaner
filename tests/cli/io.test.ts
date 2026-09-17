import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';

import { describe, expect, it } from 'vitest';

import { assertSafeOutputTarget, readInput, readStdin, writeOutput } from '../../src/cli/io';

/**
 * Create a readable stream that emits the given chunks.
 *
 * @param {string[]} chunks - Chunks emitted by the stream in order.
 *
 * @returns {Readable} Stream over the given chunks.
 */
function streamOf(chunks: string[]): Readable {
  return Readable.from(chunks);
}

/**
 * Create a temporary directory for file-backed tests.
 *
 * @returns {Promise<string>} Path of the created directory.
 */
async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'html-cleaner-io-'));
}

describe('readInput', () => {
  it('reads a file as UTF-8 text', async () => {
    const directory = await makeTempDir();
    const filePath = join(directory, 'input.html');

    await writeFile(filePath, '<p>Héllo</p>', 'utf8');

    try {
      await expect(readInput(filePath)).resolves.toBe('<p>Héllo</p>');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reads stdin when no path is given', async () => {
    await expect(readInput(undefined, streamOf(['<p>from</p>', ' stdin</p>']))).resolves.toBe('<p>from</p> stdin</p>');
  });

  it('includes the path when a file cannot be read', async () => {
    const missing = join(tmpdir(), 'html-cleaner-no-such-input.html');

    await expect(readInput(missing)).rejects.toThrow(`Unable to read input file "${missing}"`);
  });
});

describe('readStdin', () => {
  it('reads a mocked stream to completion', async () => {
    await expect(readStdin(streamOf(['chunk one', 'chunk two']))).resolves.toBe('chunk onechunk two');
  });
});

describe('writeOutput', () => {
  it('writes to a new output file', async () => {
    const directory = await makeTempDir();
    const filePath = join(directory, 'out.html');

    try {
      await writeOutput('<p>out</p>\n', filePath);

      await expect(readFile(filePath, 'utf8')).resolves.toBe('<p>out</p>\n');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('overwrites an existing file in in-place mode', async () => {
    const directory = await makeTempDir();
    const filePath = join(directory, 'in.html');

    await writeFile(filePath, '<p>old</p>\n', 'utf8');

    try {
      await writeOutput('<p>new</p>\n', filePath, true);

      await expect(readFile(filePath, 'utf8')).resolves.toBe('<p>new</p>\n');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('refuses in-place writing without a path', async () => {
    await expect(writeOutput('<p>x</p>', undefined, true)).rejects.toThrow('In-place writing requires an input file');
  });

  it('includes the path when a write fails', async () => {
    const missingDirectory = join(tmpdir(), 'html-cleaner-no-such-directory');
    const filePath = join(missingDirectory, 'out.html');

    await expect(writeOutput('<p>x</p>', filePath)).rejects.toThrow(`Unable to write output file "${filePath}"`);
  });
});

describe('assertSafeOutputTarget', () => {
  it('allows unrelated input and output paths', () => {
    expect(() => assertSafeOutputTarget('in.html', 'out.html', false)).not.toThrow();
  });

  it('refuses when output resolves to the input file', () => {
    expect(() => assertSafeOutputTarget('in.html', './in.html', false)).toThrow(/Refusing to overwrite/);
  });

  it('allows the same path with --write', () => {
    expect(() => assertSafeOutputTarget('in.html', 'in.html', true)).not.toThrow();
  });

  it('allows an output without an input path', () => {
    expect(() => assertSafeOutputTarget(undefined, 'out.html', false)).not.toThrow();
  });
});
