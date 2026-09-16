/**
 * ========================================================================
 * Attribute removal
 * ========================================================================
 * Purpose: Removes attributes generically (with a keep list) or by name.
 * ========================================================================
 */

import type { Element } from 'hast';

import { attributeName, visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/**
 * Delete every attribute of an element that the predicate does not protect.
 *
 * @param {Element} element - Element to mutate.
 * @param {(name: string) => boolean} isProtected - Predicate receiving the HAST property key and attribute name.
 *
 * @returns {number} Number of attributes removed.
 */
function deleteAttributes(element: Element, isProtected: (key: string, name: string) => boolean): number {
  let removed = 0;

  for (const key of Object.keys(element.properties)) {
    if (isProtected(key, attributeName(key))) {
      continue;
    }

    delete element.properties[key];
    removed += 1;
  }

  return removed;
}

/**
 * Remove every attribute except the names listed in `keepAttributes`.
 *
 * Matching is case-insensitive and accepts both attribute names (`class`) and
 * HAST property keys (`className`).
 *
 * @returns {HtmlTransform} Transform that clears attributes and counts them.
 */
export function removeAttributes(): HtmlTransform {
  return {
    name: 'attributes',
    apply(root, context) {
      const keep = new Set(context.options.keepAttributes.map((name) => name.toLowerCase()));

      visitContent(root, (node) => {
        if (node.type !== 'element') {
          return node;
        }

        context.stats.removedAttributes += deleteAttributes(
          node,
          (key, name) => keep.has(key.toLowerCase()) || keep.has(name.toLowerCase())
        );

        return node;
      });
    },
  };
}

/**
 * Remove only the attributes named in `removeAttributeNames`.
 *
 * @returns {HtmlTransform} Transform that deletes the requested attributes.
 */
export function removeNamedAttributes(): HtmlTransform {
  return {
    name: 'named-attributes',
    apply(root, context) {
      const targets = new Set(context.options.removeAttributeNames.map((name) => name.toLowerCase()));

      if (targets.size === 0) {
        return;
      }

      visitContent(root, (node) => {
        if (node.type !== 'element') {
          return node;
        }

        context.stats.removedAttributes += deleteAttributes(
          node,
          (key, name) => !targets.has(key.toLowerCase()) && !targets.has(name.toLowerCase())
        );

        return node;
      });
    },
  };
}
