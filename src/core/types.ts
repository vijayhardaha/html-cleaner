/**
 * ========================================================================
 * Core cleaner types
 * ========================================================================
 * Purpose: Single source of truth for the cleaner option shape, transform
 *          context, statistics, and result objects every transform shares.
 * ========================================================================
 */

import type { Root } from 'hast';

/** Option group controlling generic attribute filtering. */
export interface AttributeOptions {
  /** Remove every attribute except the names listed in `keepAttributes`. */
  removeAttributes: boolean;
  /** Attribute names that survive `removeAttributes`. */
  keepAttributes: string[];
  /** Explicit attribute names to remove, matched case-insensitively. */
  removeAttributeNames: string[];
}

/** Option group controlling deterministic output formatting. */
export interface FormatOptions {
  /** Enable AST-based formatting before serialization. */
  format: boolean;
  /** Indentation unit: a number of spaces or a tab character. */
  indent: number | 'tab';
  /** Line ending written into formatted output. */
  newline: 'lf' | 'crlf';
  /** Append a trailing newline to formatted output. */
  finalNewline: boolean;
}

/** Complete option set for a single cleaning run. */
export interface CleanerOptions extends AttributeOptions, FormatOptions {
  /** Remove `style` attributes. */
  removeStyles: boolean;
  /** Remove `class` attributes. */
  removeClasses: boolean;
  /** Remove `id` attributes. */
  removeIds: boolean;
  /** Strip all element markup while keeping textual content. */
  stripTags: boolean;
  /** Emit readable line breaks when stripping tags. */
  preserveBreaksWhenStripping: boolean;
  /** Collapse runs of non-breaking spaces into regular spaces. */
  collapseNbsp: boolean;
  /** Treat whitespace/NBSP-only nodes as empty content. */
  removeEmptyNbsp: boolean;
  /** Convert `<b>` elements to `<strong>`. */
  convertBold: boolean;
  /** Convert `<i>` elements to `<em>`. */
  convertItalic: boolean;
  /** Remove non-void elements without meaningful content. */
  removeEmpty: boolean;
  /** Unwrap `<span>` elements while keeping their children. */
  removeSpans: boolean;
  /** Remove `<img>` elements including their content. */
  removeImages: boolean;
  /** Unwrap `<a>` elements while keeping their children. */
  removeLinks: boolean;
  /** Remove table structure while preserving descendant content. */
  removeTables: boolean;
  /** Rename table elements to `div` while preserving hierarchy. */
  tablesToDiv: boolean;
  /** Remove comment nodes. */
  removeComments: boolean;
}

/** Per-run counters describing what a cleaning pass changed. */
export interface TransformStats {
  /** Comment nodes removed. */
  removedComments: number;
  /** Attributes dropped by generic attribute removal. */
  removedAttributes: number;
  /** `style` attributes removed. */
  removedStyles: number;
  /** `class` attributes removed. */
  removedClasses: number;
  /** `id` attributes removed. */
  removedIds: number;
  /** Empty elements removed. */
  removedEmptyNodes: number;
  /** Image elements removed. */
  removedImages: number;
  /** Anchor elements unwrapped. */
  unwrappedLinks: number;
  /** Span elements unwrapped. */
  unwrappedSpans: number;
  /** `<b>` elements converted to `<strong>`. */
  convertedBold: number;
  /** `<i>` elements converted to `<em>`. */
  convertedItalic: number;
  /** Table structural elements removed. */
  removedTableElements: number;
  /** Table elements renamed to `div`. */
  convertedTableElements: number;
  /** Nodes whose non-breaking spaces were normalized. */
  normalizedNbspNodes: number;
}

/** Execution state handed to every transform. */
export interface TransformContext {
  /** Options resolved for this run. */
  options: CleanerOptions;
  /** Counters updated by the transforms that run. */
  stats: TransformStats;
}

/** Independent, composable AST mutation. */
export interface HtmlTransform {
  /** Stable identifier used for ordering and reporting. */
  name: string;
  /** Apply the transformation to the tree in place. */
  apply(root: Root, context: TransformContext): void;
}

/** Result of one cleaning run. */
export interface CleanResult {
  /** Serialized cleaned HTML. */
  html: string;
  /** Counters collected while cleaning. */
  stats: TransformStats;
}

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

/** Shared immutable default options; never mutate these in place. */
export const DEFAULT_OPTIONS: Readonly<CleanerOptions> = Object.freeze(defaultOptions);

/**
 * Create a fresh, mutable copy of the default options so callers can never
 * mutate the shared defaults.
 *
 * @returns A new option object equal to `DEFAULT_OPTIONS`.
 */
export function createDefaultOptions(): CleanerOptions {
  return {
    ...DEFAULT_OPTIONS,
    keepAttributes: [...DEFAULT_OPTIONS.keepAttributes],
    removeAttributeNames: [...DEFAULT_OPTIONS.removeAttributeNames],
  };
}
