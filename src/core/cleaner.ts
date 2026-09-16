/**
 * ========================================================================
 * Cleaner engine
 * ========================================================================
 * Purpose: Assembles options into one executable cleaning run: parse once,
 *          run the enabled transforms in order, format, serialize once.
 * ========================================================================
 */

import { createTransformContext } from './context';
import { runTransforms } from './pipeline';
import type { HtmlTransform, CleanerOptions, CleanResult } from './types';
import { createDefaultOptions } from './types';
import { formatHtml } from '../formatter/format';
import { parseHtml } from '../parser/parse';
import { stringifyHtml } from '../parser/stringify';
import { removeAttributes, removeNamedAttributes } from '../transforms/attributes';
import { removeClasses } from '../transforms/classes';
import { removeComments } from '../transforms/comments';
import { removeEmptyElements } from '../transforms/empty';
import { removeIds } from '../transforms/ids';
import { removeImages } from '../transforms/images';
import { removeLinks } from '../transforms/links';
import { normalizeNbsp } from '../transforms/nbsp';
import { convertSemanticTags } from '../transforms/semantic';
import { removeSpans } from '../transforms/spans';
import { stripAllTags } from '../transforms/strip-tags';
import { removeStyles } from '../transforms/styles';
import { removeTables, tablesToDivs } from '../transforms/tables';

/**
 * Merge partial options over the defaults.
 *
 * @param {Partial<CleanerOptions>} overrides - Options supplied by a caller, preset, or CLI.
 *
 * @returns {CleanerOptions} Complete option set for a run.
 */
export function resolveOptions(overrides: Partial<CleanerOptions> = {}): CleanerOptions {
  return { ...createDefaultOptions(), ...overrides };
}

/**
 * Select the transforms enabled by resolved options, in execution order.
 *
 * `removeTables` and `tablesToDiv` are mutually exclusive: when both are set,
 * table removal wins and conversion is skipped.
 *
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {HtmlTransform[]} Transforms to run, in order.
 */
export function buildTransforms(options: CleanerOptions): HtmlTransform[] {
  const transforms: HtmlTransform[] = [];

  if (options.removeComments) {
    transforms.push(removeComments());
  }

  if (options.collapseNbsp) {
    transforms.push(normalizeNbsp());
  }

  transforms.push(...convertSemanticTags(options));

  if (options.removeSpans) {
    transforms.push(removeSpans());
  }

  if (options.removeLinks) {
    transforms.push(removeLinks());
  }

  if (options.removeImages) {
    transforms.push(removeImages());
  }

  if (options.removeTables) {
    transforms.push(removeTables());
  } else if (options.tablesToDiv) {
    transforms.push(tablesToDivs());
  }

  if (options.removeAttributes) {
    transforms.push(removeAttributes());
  }

  if (options.removeAttributeNames.length > 0) {
    transforms.push(removeNamedAttributes());
  }

  if (options.removeStyles) {
    transforms.push(removeStyles());
  }

  if (options.removeClasses) {
    transforms.push(removeClasses());
  }

  if (options.removeIds) {
    transforms.push(removeIds());
  }

  if (options.removeEmpty) {
    transforms.push(removeEmptyElements());
  }

  if (options.stripTags) {
    transforms.push(stripAllTags(options.preserveBreaksWhenStripping));
  }

  return transforms;
}

/**
 * Apply trailing-newline policy to serialized output.
 *
 * Empty output stays empty, so cleaning an emptied document never turns into a
 * lone newline.
 *
 * @param {string} html - Serialized output.
 * @param {CleanerOptions} options - Resolved options.
 *
 * @returns {string} Output with a single trailing newline, or none.
 */
function finalizeOutput(html: string, options: CleanerOptions): string {
  if (!options.format) {
    return html;
  }

  const trimmed = html.replace(/[\r\n]+$/, '');

  if (trimmed.length === 0) {
    return '';
  }

  const newline = options.newline === 'crlf' ? '\r\n' : '\n';

  return options.finalNewline ? `${trimmed}${newline}` : trimmed;
}

/**
 * Clean an HTML string.
 *
 * HTML is parsed once, transformed in memory, formatted when enabled, and
 * serialized once. This cleaner normalizes markup; it is not a security
 * sanitizer and does not guarantee removal of dangerous content.
 *
 * @param {string} input - HTML source text.
 * @param {Partial<CleanerOptions>} overrides - Options merged over the defaults.
 *
 * @returns {CleanResult} Cleaned HTML plus statistics for the run.
 */
export function cleanHtml(input: string, overrides: Partial<CleanerOptions> = {}): CleanResult {
  const options = resolveOptions(overrides);
  const context = createTransformContext(options);
  const root = parseHtml(input);

  runTransforms(root, buildTransforms(options), context);

  if (options.format) {
    formatHtml(root, options);
  }

  return { html: finalizeOutput(stringifyHtml(root), options), stats: context.stats };
}
