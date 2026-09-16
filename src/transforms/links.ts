/**
 * ========================================================================
 * Link unwrapping
 * ========================================================================
 * Purpose: Removes `<a>` wrappers while keeping their content.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Unwrap every `<a>`, keeping its children in place.
 *
 * @returns {HtmlTransform} Transform that unwraps anchors and counts them.
 */
export function removeLinks(): HtmlTransform {
  return {
    name: 'links',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || node.tagName.toLowerCase() !== 'a') {
          return node;
        }

        context.stats.unwrappedLinks += 1;

        return node.children;
      });
    },
  };
}
