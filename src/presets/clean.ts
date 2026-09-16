/**
 * ========================================================================
 * Clean preset
 * ========================================================================
 * Purpose: Presentational attribute cleanup on top of the safe preset.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/** Removes presentational attributes and empty leftovers. */
export const CLEAN_PRESET: Readonly<Partial<CleanerOptions>> = Object.freeze({
  removeComments: true,
  removeStyles: true,
  removeClasses: true,
  removeIds: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  format: true,
});
