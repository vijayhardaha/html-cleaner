/**
 * ========================================================================
 * Safe preset
 * ========================================================================
 * Purpose: The documented conservative cleanup, matching the CLI defaults.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/** Conservative preset: removes markup noise without deleting content. */
export const SAFE_PRESET: Readonly<Partial<CleanerOptions>> = Object.freeze({
  removeComments: true,
  collapseNbsp: true,
  removeEmpty: true,
  convertBold: true,
  convertItalic: true,
  format: true,
});
