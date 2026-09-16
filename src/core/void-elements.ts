/**
 * ========================================================================
 * Void elements
 * ========================================================================
 * Purpose: The explicit HTML void-element set shared by the emptiness and
 *          table transforms.
 * ========================================================================
 */

/** HTML elements that never have children or an end tag. */
export const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

/**
 * Check whether a tag name is a void element.
 *
 * @param {string} tagName - Tag name to test, in any case.
 *
 * @returns {boolean} `true` for void elements.
 */
export function isVoidElement(tagName: string): boolean {
  return VOID_ELEMENTS.has(tagName.toLowerCase());
}
