/**
 * ========================================================================
 * Transform pipeline
 * ========================================================================
 * Purpose: Runs independent transforms over one parsed tree, in order,
 *          without reparsing or reserializing between steps.
 * ========================================================================
 */

import type { Root } from 'hast';

import type { HtmlTransform, TransformContext } from './types';

/**
 * Apply every transform to the tree in order.
 *
 * @param {Root} root - Parsed tree that transforms mutate in place.
 * @param {HtmlTransform[]} transforms - Transforms to execute, in execution order.
 * @param {TransformContext} context - Resolved options and shared counters.
 *
 * @returns {Root} The same tree, after all transforms ran.
 */
export function runTransforms(root: Root, transforms: HtmlTransform[], context: TransformContext): Root {
  for (const transform of transforms) {
    transform.apply(root, context);
  }

  return root;
}
