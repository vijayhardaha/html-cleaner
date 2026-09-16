/**
 * ========================================================================
 * Text extraction rules
 * ========================================================================
 * Purpose: Tag sets that decide how textual content is derived when tags are
 *          stripped or turned into readable text.
 * ========================================================================
 */

/** Elements whose text content is not visible and must not be surfaced. */
export const SKIPPED_TEXT_TAGS: ReadonlySet<string> = new Set([
  'head',
  'iframe',
  'noscript',
  'script',
  'style',
  'template',
]);

/** Block-level elements that end a line when breaks are preserved. */
export const ELEMENT_TEXT_RULES: ReadonlySet<string> = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hgroup',
  'hr',
  'li',
  'main',
  'menu',
  'nav',
  'ol',
  'p',
  'pre',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
]);
