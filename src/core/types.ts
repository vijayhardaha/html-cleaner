/**
 * ========================================================================
 * Core cleaner types
 * ========================================================================
 * Purpose: Single source of truth for the cleaner option shape, transform
 *          context, statistics, and result objects every transform shares.
 * ========================================================================
 */

import type { Root } from 'hast';

/**
 * Option group controlling generic attribute filtering.
 *
 * @property {boolean} removeAttributes - Remove every attribute except the names listed in `keepAttributes`.
 * @property {string[]} keepAttributes - Attribute names that survive `removeAttributes`.
 * @property {string[]} removeAttributeNames - Explicit attribute names to remove, matched case-insensitively.
 */
export interface AttributeOptions {
  removeAttributes: boolean;
  keepAttributes: string[];
  removeAttributeNames: string[];
}

/**
 * Option group controlling deterministic output formatting.
 *
 * @property {boolean} format - Enable AST-based formatting before serialization.
 * @property {number | 'tab'} indent - Indentation unit: a number of spaces or a tab character.
 * @property {'lf' | 'crlf'} newline - Line ending written into formatted output.
 * @property {boolean} finalNewline - Append a trailing newline to formatted output.
 */
export interface FormatOptions {
  format: boolean;
  indent: number | 'tab';
  newline: 'lf' | 'crlf';
  finalNewline: boolean;
}

/**
 * Complete option set for a single cleaning run.
 *
 * @property {boolean} removeAttributes - Remove every attribute except those kept by name.
 * @property {string[]} keepAttributes - Attribute names preserved by generic attribute removal.
 * @property {string[]} removeAttributeNames - Attribute names removed explicitly.
 * @property {boolean} removeStyles - Remove `style` attributes.
 * @property {boolean} removeClasses - Remove `class` attributes.
 * @property {boolean} removeIds - Remove `id` attributes.
 * @property {boolean} stripTags - Strip all element markup while keeping textual content.
 * @property {boolean} preserveBreaksWhenStripping - Emit readable line breaks when stripping tags.
 * @property {boolean} collapseNbsp - Collapse runs of non-breaking spaces into regular spaces.
 * @property {boolean} removeEmptyNbsp - Treat whitespace/NBSP-only nodes as empty content.
 * @property {boolean} convertBold - Convert `<b>` elements to `<strong>`.
 * @property {boolean} convertItalic - Convert `<i>` elements to `<em>`.
 * @property {boolean} removeEmpty - Remove non-void elements without meaningful content.
 * @property {boolean} removeSpans - Unwrap `<span>` elements while keeping their children.
 * @property {boolean} removeImages - Remove `<img>` elements.
 * @property {boolean} removeLinks - Unwrap `<a>` elements while keeping their children.
 * @property {boolean} removeTables - Remove table structure while preserving descendant content.
 * @property {boolean} tablesToDiv - Rename table elements to `div` while preserving hierarchy.
 * @property {boolean} removeComments - Remove comment nodes.
 * @property {boolean} format - Enable deterministic output formatting.
 * @property {number | 'tab'} indent - Indentation unit used by the formatter.
 * @property {'lf' | 'crlf'} newline - Line ending used by the formatter.
 * @property {boolean} finalNewline - Append a trailing newline to formatted output.
 */
export interface CleanerOptions extends AttributeOptions, FormatOptions {
  removeStyles: boolean;
  removeClasses: boolean;
  removeIds: boolean;
  stripTags: boolean;
  preserveBreaksWhenStripping: boolean;
  collapseNbsp: boolean;
  removeEmptyNbsp: boolean;
  convertBold: boolean;
  convertItalic: boolean;
  removeEmpty: boolean;
  removeSpans: boolean;
  removeImages: boolean;
  removeLinks: boolean;
  removeTables: boolean;
  tablesToDiv: boolean;
  removeComments: boolean;
}

/**
 * Per-run counters describing what a cleaning pass changed.
 *
 * @property {number} removedComments - Comment nodes removed.
 * @property {number} removedAttributes - Attributes dropped by generic attribute removal.
 * @property {number} removedStyles - `style` attributes removed.
 * @property {number} removedClasses - `class` attributes removed.
 * @property {number} removedIds - `id` attributes removed.
 * @property {number} removedEmptyNodes - Empty elements removed.
 * @property {number} removedImages - Image elements removed.
 * @property {number} unwrappedLinks - Anchor elements unwrapped.
 * @property {number} unwrappedSpans - Span elements unwrapped.
 * @property {number} convertedBold - `<b>` elements converted to `<strong>`.
 * @property {number} convertedItalic - `<i>` elements converted to `<em>`.
 * @property {number} removedTableElements - Table structural elements removed.
 * @property {number} convertedTableElements - Table elements renamed to `div`.
 * @property {number} normalizedNbspNodes - Nodes whose non-breaking spaces were normalized.
 */
export interface TransformStats {
  removedComments: number;
  removedAttributes: number;
  removedStyles: number;
  removedClasses: number;
  removedIds: number;
  removedEmptyNodes: number;
  removedImages: number;
  unwrappedLinks: number;
  unwrappedSpans: number;
  convertedBold: number;
  convertedItalic: number;
  removedTableElements: number;
  convertedTableElements: number;
  normalizedNbspNodes: number;
}

/**
 * Execution state handed to every transform.
 *
 * @property {CleanerOptions} options - Options resolved for the current run.
 * @property {TransformStats} stats - Counters updated by the transforms that run.
 */
export interface TransformContext {
  options: CleanerOptions;
  stats: TransformStats;
}

/**
 * Independent, composable AST mutation.
 *
 * @property {string} name - Stable identifier used for ordering and reporting.
 */
export interface HtmlTransform {
  name: string;

  /**
   * Apply the transformation to the tree in place.
   *
   * @param {Root} root - Parsed tree to mutate.
   * @param {TransformContext} context - Resolved options and shared counters.
   */
  apply(root: Root, context: TransformContext): void;
}

/**
 * Result of one cleaning run.
 *
 * @property {string} html - Serialized cleaned HTML.
 * @property {TransformStats} stats - Counters collected while cleaning.
 */
export interface CleanResult {
  html: string;
  stats: TransformStats;
}

/** Conservative default option set applied when a run enables nothing explicitly. */
const defaultOptions: CleanerOptions = {
  removeAttributes: false,
  keepAttributes: [],
  removeAttributeNames: [],
  removeStyles: false,
  removeClasses: false,
  removeIds: false,
  stripTags: false,
  preserveBreaksWhenStripping: false,
  collapseNbsp: true,
  removeEmptyNbsp: false,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  removeSpans: false,
  removeImages: false,
  removeLinks: false,
  removeTables: false,
  tablesToDiv: false,
  removeComments: true,
  format: true,
  indent: 2,
  newline: 'lf',
  finalNewline: true,
};

Object.freeze(defaultOptions.keepAttributes);
Object.freeze(defaultOptions.removeAttributeNames);

/** Shared immutable defaults; never mutate this object in place. */
export const DEFAULT_OPTIONS: Readonly<CleanerOptions> = Object.freeze(defaultOptions);

/**
 * Create a fresh copy of the default options so callers can never mutate the
 * shared defaults.
 *
 * @returns {CleanerOptions} A new option object equal to `DEFAULT_OPTIONS`.
 */
export function createDefaultOptions(): CleanerOptions {
  return {
    ...DEFAULT_OPTIONS,
    keepAttributes: [...DEFAULT_OPTIONS.keepAttributes],
    removeAttributeNames: [...DEFAULT_OPTIONS.removeAttributeNames],
  };
}
