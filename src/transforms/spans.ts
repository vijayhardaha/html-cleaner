/**
 * ========================================================================
 * Span unwrapping
 * ========================================================================
 * Purpose: Removes `<span>` wrappers while keeping their content.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Unwrap every `<span>`, keeping its children in place.
 *
 * @returns {HtmlTransform} Transform that unwraps spans and counts them.
 */
export function removeSpans(): HtmlTransform {
  return {
    name: 'spans',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || node.tagName.toLowerCase() !== 'span') {
          return node;
        }

        context.stats.unwrappedSpans += 1;

        return node.children;
      });
    },
  };
}
