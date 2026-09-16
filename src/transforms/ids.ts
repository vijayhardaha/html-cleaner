/**
 * ========================================================================
 * ID removal
 * ========================================================================
 * Purpose: Drops `id` attributes.
 * ========================================================================
 */

import { removeProperty, visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Remove every `id` attribute.
 *
 * @returns {HtmlTransform} Transform that deletes ids and counts them.
 */
export function removeIds(): HtmlTransform {
  return {
    name: 'ids',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element') {
          return node;
        }

        if (removeProperty(node, 'id')) {
          context.stats.removedIds += 1;
        }

        return node;
      });
    },
  };
}
