/**
 * ========================================================================
 * Transform test helpers
 * ========================================================================
 * Purpose: Shared harness that runs a single transform over an HTML fragment
 *          so transform tests stay focused on behavior.
 * ========================================================================
 */
import type { Root } from 'hast';
import type { CleanerOptions, HtmlTransform, TransformStats } from '../../src/core/types';
/**
 * Outcome of a single transform run.
 *
 * @property {string} html - Serialized tree after the transform ran.
 * @property {Root} root - Mutated tree, for structural assertions.
 * @property {TransformStats} stats - Counters collected during the run.
 */
export interface TransformRun {
  html: string;
  root: Root;
  stats: TransformStats;
}
/**
 * Run transforms over an HTML fragment without formatting or serializing
 * twice.
 *
 * @param {string} html - Input HTML fragment.
 * @param {HtmlTransform[]} transforms - Transforms to apply, in order.
 * @param {Partial<CleanerOptions>} overrides - Option overrides placed on top of the defaults.
 *
 * @returns {TransformRun} Serialized output, mutated tree, and statistics.
 */
export declare function runTransform(
  html: string,
  transforms: HtmlTransform[],
  overrides?: Partial<CleanerOptions>
): TransformRun;
