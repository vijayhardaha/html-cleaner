/**
 * ========================================================================
 * Inline style removal
 * ========================================================================
 * Purpose: Drops `style` attributes.
 * ========================================================================
 */

import { removeProperty, visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Remove every `style` attribute.
 *
 * @returns {HtmlTransform} Transform that deletes inline styles and counts them.
 */
export function removeStyles(): HtmlTransform {
  return {
    name: 'styles',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element') {
          return node;
        }

        if (removeProperty(node, 'style')) {
          context.stats.removedStyles += 1;
        }

        return node;
      });
    },
  };
}
