/**
 * ========================================================================
 * Table transforms
 * ========================================================================
 * Purpose: Two mutually exclusive table strategies: remove table structure
 *          while keeping content, or rename table elements to `div`.
 * ========================================================================
 */

import { isText, visitContent } from '../core/tree';
import type { HtmlTransform, TransformContext } from '../core/types';
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
 * have no content to keep. Whitespace-only text that only ever separated
 * table tags is dropped as well: unwrapping would splice it into the parent,
 * and an all-text container is one the formatter deliberately leaves alone.
 *
 * @param {TransformContext} context - Per-run context carrying options and stats.
 *
 * @returns {HtmlTransform} Transform that unwraps table structure and counts it.
 */
export function removeTables(context?: TransformContext): HtmlTransform {
  // Runs `collapseNbsp` first, so plain whitespace is the only residue to drop.
  const dropWhitespaceOnlyText = context?.options.collapseNbsp ?? false;

  return {
    name: 'tables-remove',
    apply(root, transformContext) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || !TABLE_TAGS.has(node.tagName.toLowerCase())) {
          return node;
        }

        transformContext.stats.removedTableElements += 1;

        if (isVoidElement(node.tagName)) {
          return null;
        }

        return dropWhitespaceOnlyText
          ? node.children.filter((child) => !(isText(child) && child.value.trim() === ''))
          : node.children;
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
