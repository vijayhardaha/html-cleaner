/**
 * ========================================================================
 * NBSP normalization
 * ========================================================================
 * Purpose: Converts runs of non-breaking spaces into a single regular space
 *          so later emptiness checks behave predictably.
 * ========================================================================
 */

import { visitContent } from '../core/tree';
import type { HtmlTransform } from '../core/types';

/** Runs of one or more non-breaking spaces. */
const NBSP_RUN = /\u00a0+/g;

/**
 * Collapse every run of non-breaking spaces into one regular space.
 *
 * Text nodes hold decoded characters, so `&nbsp;` and a literal U+00A0 are
 * normalized identically and no double-encoded entity can appear.
 *
 * @returns {HtmlTransform} Transform that normalizes NBSP runs and counts affected nodes.
 */
export function normalizeNbsp(): HtmlTransform {
  return {
    name: 'nbsp',
    apply(root, context) {
      visitContent(root, (node) => {
        if (node.type !== 'text' || !node.value.includes('\u00a0')) {
          return node;
        }

        node.value = node.value.replace(NBSP_RUN, ' ');
        context.stats.normalizedNbspNodes += 1;

        return node;
      });
    },
  };
}
