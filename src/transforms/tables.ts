/**
 * ========================================================================
 * Table transforms
 * ========================================================================
 * Purpose: Two mutually exclusive table strategies: remove table structure
 *          while keeping content, or rename table elements to `div`.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';
import { isVoidElement } from '../core/void-elements';

/** Elements that carry table structure. */
export const TABLE_TAGS: ReadonlySet<string> = new Set([
  'caption',
  'col',
  'colgroup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
]);

/**
 * Remove table structure while preserving descendant content.
 *
 * Structural elements are replaced by their children, so cell content and
 * ordering survive. Void `col` elements are removed outright, because they
 * have no content to keep.
 *
 * @returns {HtmlTransform} Transform that unwraps table structure and counts it.
 */
export function removeTables(): HtmlTransform {
  return {
    name: 'tables-remove',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || !TABLE_TAGS.has(node.tagName.toLowerCase())) {
          return node;
        }

        context.stats.removedTableElements += 1;

        return isVoidElement(node.tagName) ? null : node.children;
      });
    },
  };
}

/**
 * Rename table structure to `div` while preserving hierarchy and order.
 *
 * @returns {HtmlTransform} Transform that converts table elements and counts it.
 */
export function tablesToDivs(): HtmlTransform {
  return {
    name: 'tables-to-div',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || !TABLE_TAGS.has(node.tagName.toLowerCase())) {
          return node;
        }

        node.tagName = 'div';
        context.stats.convertedTableElements += 1;

        return node;
      });
    },
  };
}
