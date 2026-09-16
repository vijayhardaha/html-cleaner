/**
 * ========================================================================
 * Semantic tag conversion
 * ========================================================================
 * Purpose: Replaces presentational `<b>`/`<i>` with semantic
 *          `<strong>`/`<em>` while keeping children untouched.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { CleanerOptions, HtmlTransform, TransformStats } from '../core/types';

/** Statistics counters that record semantic conversions. */
type SemanticCounter = Extract<keyof TransformStats, 'convertedBold' | 'convertedItalic'>;

/**
 * Build a single tag-rename transform.
 *
 * @param {string} from - Source tag name, matched case-insensitively.
 * @param {string} to - Target tag name.
 * @param {SemanticCounter} counter - Statistics counter to increment.
 * @param {string} name - Transform name used for ordering and reporting.
 *
 * @returns {HtmlTransform} Transform that renames matching elements.
 */
function createSemanticTransform(from: string, to: string, counter: SemanticCounter, name: string): HtmlTransform {
  return {
    name,
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'element' || node.tagName.toLowerCase() !== from) {
          return node;
        }

        node.tagName = to;
        context.stats[counter] += 1;

        return node;
      });
    },
  };
}

/**
 * Build the semantic conversion transforms enabled by the given options.
 *
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {HtmlTransform[]} Enabled semantic transforms, in execution order.
 */
export function convertSemanticTags(options: CleanerOptions): HtmlTransform[] {
  const transforms: HtmlTransform[] = [];

  if (options.convertBold) {
    transforms.push(createSemanticTransform('b', 'strong', 'convertedBold', 'semantic-bold'));
  }

  if (options.convertItalic) {
    transforms.push(createSemanticTransform('i', 'em', 'convertedItalic', 'semantic-italic'));
  }

  return transforms;
}
