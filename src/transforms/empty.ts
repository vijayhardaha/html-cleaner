/**
 * ========================================================================
 * Empty element removal
 * ========================================================================
 * Purpose: Removes non-void elements that carry no meaningful content after
 *          whitespace and NBSP handling.
 * ========================================================================
 */

import type { Element, ElementContent, RootContent } from 'hast';

import type { ContentContainer } from '../core/tree';
import type { CleanerOptions, HtmlTransform } from '../core/types';
import { isVoidElement } from '../core/void-elements';

/** Regular whitespace that never counts as content. */
const REGULAR_WHITESPACE = /[ \t\n\r\f\v]+/g;

/** Content made of non-breaking spaces only. */
const NBSP_ONLY = /^\u00a0+$/;

/**
 * Decide whether a text node counts as meaningful content.
 *
 * @param {string} value - Text node value.
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {boolean} `true` when the text should keep its parent alive.
 */
function textHasContent(value: string, options: CleanerOptions): boolean {
  const withoutRegularWhitespace = value.replace(REGULAR_WHITESPACE, '');

  if (withoutRegularWhitespace.length === 0) {
    return false;
  }

  return !(options.removeEmptyNbsp && NBSP_ONLY.test(withoutRegularWhitespace));
}

/**
 * Decide whether one child node counts as meaningful content.
 *
 * @param {ElementContent} node - Child node to inspect.
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {boolean} `true` when the child keeps its parent alive.
 */
function childHasContent(node: ElementContent, options: CleanerOptions): boolean {
  if (node.type === 'text') {
    return textHasContent(node.value, options);
  }

  if (node.type === 'comment') {
    return false;
  }

  if (node.type !== 'element') {
    return true;
  }

  if (isVoidElement(node.tagName)) {
    return true;
  }

  return !isNodeEmpty(node, options);
}

/**
 * Decide whether an element is empty.
 *
 * Void elements are never empty, because they carry meaning without content.
 *
 * @param {Element} node - Element to inspect.
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {boolean} `true` when the element has no meaningful content.
 */
export function isNodeEmpty(node: Element, options: CleanerOptions): boolean {
  if (isVoidElement(node.tagName)) {
    return false;
  }

  return !node.children.some((child) => childHasContent(child, options));
}

/**
 * Remove empty children from a container, deepest descendants first.
 *
 * @param {ContentContainer} container - Container whose children are pruned.
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {number} Number of elements removed, including nested ones.
 */
function pruneEmpty(container: ContentContainer, options: CleanerOptions): number {
  const next: RootContent[] = [];
  let removed = 0;

  for (const child of container.children) {
    if (child.type === 'element' && !isVoidElement(child.tagName)) {
      removed += pruneEmpty(child, options);

      if (isNodeEmpty(child, options)) {
        removed += 1;
        continue;
      }
    }

    next.push(child);
  }

  container.children = next;

  return removed;
}

/**
 * Remove every empty non-void element.
 *
 * @returns {HtmlTransform} Transform that prunes empty elements and counts them.
 */
export function removeEmptyElements(): HtmlTransform {
  return {
    name: 'empty',
    apply(root, context) {
      context.stats.removedEmptyNodes += pruneEmpty(root, context.options);
    },
  };
}
