/**
 * ========================================================================
 * Aggressive preset
 * ========================================================================
 * Purpose: Text-first cleanup that also removes attributes and tables.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/** Removes every attribute, unwraps wrappers, and flattens tables. */
export const AGGRESSIVE_PRESET: Readonly<Partial<CleanerOptions>> = Object.freeze({
  removeComments: true,
  removeAttributes: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  removeSpans: true,
  removeImages: true,
  removeLinks: true,
  removeTables: true,
  format: true,
});
