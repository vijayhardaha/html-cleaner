/**
 * ========================================================================
 * Comment removal
 * ========================================================================
 * Purpose: Drops comment nodes from the tree.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Remove every comment node.
 *
 * @returns {HtmlTransform} Transform that deletes comments and counts them.
 */
export function removeComments(): HtmlTransform {
  return {
    name: 'comments',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'comment') {
          return node;
        }

        context.stats.removedComments += 1;

        return null;
      });
    },
  };
}
