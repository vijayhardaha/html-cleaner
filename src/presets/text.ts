/**
 * ========================================================================
 * Text preset
 * ========================================================================
 * Purpose: Reduces input to readable plain text.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/** Strips all element markup and keeps readable line breaks. */
export const TEXT_PRESET: Readonly<Partial<CleanerOptions>> = Object.freeze({
  stripTags: true,
  preserveBreaksWhenStripping: true,
  collapseNbsp: true,
  removeComments: true,
  format: false,
});
