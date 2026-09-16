/**
 * ========================================================================
 * Configuration loading
 * ========================================================================
 * Purpose: Reads a JSON configuration file and reports precise failures
 *          instead of silently ignoring bad input.
 * ========================================================================
 */

import { readFile } from 'node:fs/promises';

import { validateOptionValues } from './merge';
import type { CleanerOptions } from '../core/types';

/**
 * Load cleaner options from a JSON file.
 *
 * @param {string} filePath - Path to the configuration file.
 *
 * @returns {Promise<Partial<CleanerOptions>>} Options read from the file.
 *
 * @throws {Error} When the file is missing, unreadable, not a JSON object, or holds invalid values.
 */
export async function loadConfig(filePath: string): Promise<Partial<CleanerOptions>> {
  let raw: string;

  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read config file "${filePath}": ${(error as Error).message}`);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in config file "${filePath}": ${(error as Error).message}`);
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Config file "${filePath}" must contain a JSON object.`);
  }

  const options = parsed as Partial<CleanerOptions>;

  validateOptionValues(options, `config file "${filePath}"`);

  return options;
}
