/**
 * ========================================================================
 * Class removal
 * ========================================================================
 * Purpose: Drops `class` attributes.
 * ========================================================================
 */

import { removeProperty, visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Remove every `class` attribute.
 *
 * @returns {HtmlTransform} Transform that deletes classes and counts them.
 */
export function removeClasses(): HtmlTransform {
  return {
    name: 'classes',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element') {
          return node;
        }

        if (removeProperty(node, 'className') || removeProperty(node, 'class')) {
          context.stats.removedClasses += 1;
        }

        return node;
      });
    },
  };
}
