/**
 * ========================================================================
 * Article preset
 * ========================================================================
 * Purpose: Clean preset plus removal of editorial media and wrappers.
 * ========================================================================
 */

import type { CleanerOptions } from '../core/types';

/** Clean preset that also unwraps spans and links and drops images. */
export const ARTICLE_PRESET: Readonly<Partial<CleanerOptions>> = Object.freeze({
  removeComments: true,
  removeStyles: true,
  removeClasses: true,
  removeIds: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  removeSpans: true,
  removeImages: true,
  removeLinks: true,
  format: true,
});
