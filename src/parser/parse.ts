/**
 * ========================================================================
 * HTML parser
 * ========================================================================
 * Purpose: Turns an HTML string into a HAST tree. Parsing happens once per
 *          cleaning run; every transform works on the returned AST.
 * ========================================================================
 */

import type { Root } from 'hast';
import rehypeParse from 'rehype-parse';
import { unified } from 'unified';

/**
 * Parse HTML into a HAST root.
 *
 * Parsing uses the fragment context so input is treated as a content fragment:
 * unopened `html`, `head`, and `body` elements are not wrapped around the
 * result.
 *
 * @param {string} input - HTML source text.
 *
 * @returns {Root} The parsed HAST root.
 */
export function parseHtml(input: string): Root {
  return unified().use(rehypeParse, { fragment: true }).parse(input);
}
