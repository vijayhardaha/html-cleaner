/**
 * ========================================================================
 * Option merging
 * ========================================================================
 * Purpose: Deterministic precedence for option sources, plus validation of
 *          enumerated values that must not be invented.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/**
 * Validate enumerated option values.
 *
 * @param {Partial<CleanerOptions>} options - Partial options to validate.
 * @param {string} source - Label used in error messages, usually a file path.
 *
 * @throws {Error} When `indent` or `newline` holds an unsupported value.
 */
export function validateOptionValues(options: Partial<CleanerOptions>, source = 'options'): void {
  const { indent, newline } = options;

  if (
    indent !== undefined
    && indent !== 'tab'
    && !(typeof indent === 'number' && Number.isInteger(indent) && indent >= 0)
  ) {
    throw new Error(`Invalid ${source} value for "indent": expected a non-negative integer or "tab".`);
  }

  if (newline !== undefined && newline !== 'lf' && newline !== 'crlf') {
    throw new Error(`Invalid ${source} value for "newline": expected "lf" or "crlf".`);
  }
}

/**
 * Drop entries whose value is `undefined` so spreads do not erase defaults.
 *
 * @param {Partial<CleanerOptions>} options - Partial options to compact.
 *
 * @returns {Partial<CleanerOptions>} Options without undefined entries.
 */
function compact(options: Partial<CleanerOptions>): Partial<CleanerOptions> {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined)
  ) as Partial<CleanerOptions>;
}

/**
 * Merge option sources using the documented precedence
 * defaults → preset → config → CLI.
 *
 * Later sources replace earlier ones per option. Array options such as
 * `keepAttributes` are replaced rather than concatenated, so the winning
 * source is always unambiguous.
 *
 * @param {CleanerOptions} defaults - Baseline defaults.
 * @param {Partial<CleanerOptions>} preset - Values from the selected preset.
 * @param {Partial<CleanerOptions>} config - Values from the configuration file.
 * @param {Partial<CleanerOptions>} cli - Values from CLI flags.
 *
 * @returns {CleanerOptions} Fully resolved options with fresh arrays.
 *
 * @throws {Error} When the merged result holds an invalid enumerated value.
 */
export function mergeOptions(
  defaults: CleanerOptions,
  preset: Partial<CleanerOptions>,
  config: Partial<CleanerOptions>,
  cli: Partial<CleanerOptions>
): CleanerOptions {
  const merged: CleanerOptions = { ...defaults, ...compact(preset), ...compact(config), ...compact(cli) };

  validateOptionValues(merged, 'merged');

  return {
    ...merged,
    keepAttributes: [...merged.keepAttributes],
    removeAttributeNames: [...merged.removeAttributeNames],
  };
}
