/**
 * ========================================================================
 * Image removal
 * ========================================================================
 * Purpose: Deletes `<img>` elements.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Remove every `<img>` element.
 *
 * Images are void elements, so removal deletes the element itself and leaves
 * surrounding content untouched.
 *
 * @returns {HtmlTransform} Transform that deletes images and counts them.
 */
export function removeImages(): HtmlTransform {
  return {
    name: 'images',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || node.tagName.toLowerCase() !== 'img') {
          return node;
        }

        context.stats.removedImages += 1;

        return null;
      });
    },
  };
}
