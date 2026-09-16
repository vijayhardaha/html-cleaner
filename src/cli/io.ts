/**
 * ========================================================================
 * CLI input and output
 * ========================================================================
 * Purpose: UTF-8 file and stream access with explicit failures that always
 *          name the path involved.
 * ========================================================================
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Readable } from 'node:stream';

/**
 * Read a readable stream to completion as UTF-8 text.
 *
 * @param {Readable} stream - Stream to read, usually stdin.
 *
 * @returns {Promise<string>} Text read from the stream.
 */
export async function readStdin(stream: Readable = process.stdin): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Buffer));
  }

  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Read input from a file, or from stdin when no path is given.
 *
 * @param {string} [path] - Input file path.
 * @param {Readable} [stream] - Stream used when no path is given.
 *
 * @returns {Promise<string>} UTF-8 input text.
 *
 * @throws {Error} When the file cannot be read; the message includes the path.
 */
export async function readInput(path?: string, stream: Readable = process.stdin): Promise<string> {
  if (path === undefined) {
    return readStdin(stream);
  }

  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read input file "${path}": ${(error as Error).message}`);
  }
}

/**
 * Write cleaned output to a file, an in-place target, or stdout.
 *
 * @param {string} content - Cleaned HTML.
 * @param {string} [path] - Destination path; stdout is used when omitted.
 * @param {boolean} [writeInPlace] - Whether the destination is the input file.
 *
 * @returns {Promise<void>} Resolves once the output is written.
 *
 * @throws {Error} When in-place writing is requested without a path, or the write fails.
 */
export async function writeOutput(content: string, path?: string, writeInPlace = false): Promise<void> {
  if (path === undefined) {
    if (writeInPlace) {
      throw new Error('In-place writing requires an input file path.');
    }

    process.stdout.write(content);

    return;
  }

  try {
    await writeFile(path, content, 'utf8');
  } catch (error) {
    throw new Error(`Unable to write output file "${path}": ${(error as Error).message}`);
  }
}

/**
 * Refuse to overwrite an input file through `--output` unless `--write` was
 * requested.
 *
 * @param {string | undefined} inputPath - Input file path.
 * @param {string | undefined} outputPath - Output file path.
 * @param {boolean} writeInPlace - Whether the run writes in place.
 *
 * @throws {Error} When both paths resolve to the same file without `--write`.
 */
export function assertSafeOutputTarget(
  inputPath: string | undefined,
  outputPath: string | undefined,
  writeInPlace: boolean
): void {
  if (writeInPlace || inputPath === undefined || outputPath === undefined) {
    return;
  }

  if (resolve(inputPath) === resolve(outputPath)) {
    throw new Error(`Refusing to overwrite "${inputPath}" through --output; use --write to modify a file in place.`);
  }
}
