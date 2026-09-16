/**
 * ========================================================================
 * Transform context
 * ========================================================================
 * Purpose: Builds the per-run state (resolved options plus zeroed counters)
 *          that every transform receives.
 * ========================================================================
 */

import type { CleanerOptions, TransformContext, TransformStats } from './types';

/**
 * Create a statistics object with every counter zeroed.
 *
 * @returns {TransformStats} A fresh statistics record.
 */
export function createEmptyStats(): TransformStats {
  return {
    removedComments: 0,
    removedAttributes: 0,
    removedStyles: 0,
    removedClasses: 0,
    removedIds: 0,
    removedEmptyNodes: 0,
    removedImages: 0,
    unwrappedLinks: 0,
    unwrappedSpans: 0,
    convertedBold: 0,
    convertedItalic: 0,
    removedTableElements: 0,
    convertedTableElements: 0,
    normalizedNbspNodes: 0,
  };
}

/**
 * Build the execution context for one cleaning run.
 *
 * @param {CleanerOptions} options - Options resolved for the run.
 *
 * @returns {TransformContext} Context carrying those options and zeroed counters.
 */
export function createTransformContext(options: CleanerOptions): TransformContext {
  return { options, stats: createEmptyStats() };
}
