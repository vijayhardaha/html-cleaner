/**
 * ========================================================================
 * HTML serializer
 * ========================================================================
 * Purpose: Serializes a HAST tree back to HTML. Serialization happens once
 *          per cleaning run, after every transform has been applied.
 * ========================================================================
 */

import type { Root } from 'hast';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';

/**
 * Serialize a HAST root to HTML.
 *
 * @param {Root} root - Tree to serialize.
 *
 * @returns {string} Serialized HTML text.
 */
export function stringifyHtml(root: Root): string {
  return unified().use(rehypeStringify).stringify(root);
}
