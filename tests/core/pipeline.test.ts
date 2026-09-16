import { describe, expect, it } from 'vitest';

import { createTransformContext } from '../../src/core/context';
import { runTransforms } from '../../src/core/pipeline';
import { visitContent } from '../../src/core/tree';
import { createDefaultOptions } from '../../src/core/types';
import type { HtmlTransform } from '../../src/core/types';
import { parseHtml } from '../../src/parser/parse';
import { stringifyHtml } from '../../src/parser/stringify';

/**
 * Build a transform that drops one tag and records its execution.
 *
 * @param {string} tag - Tag name to remove.
 * @param {string[]} log - Shared execution log.
 *
 * @returns {HtmlTransform} Transform with the requested behavior.
 */
function tagRemover(tag: string, log: string[]): HtmlTransform {
  return {
    name: tag,
    apply(root, context) {
      log.push(tag);
      visitContent(root, (node) => (node.type === 'element' && node.tagName === tag ? null : node));
      context.stats.removedEmptyNodes += 1;
    },
  };
}

describe('runTransforms', () => {
  it('runs transforms in order and accumulates statistics', () => {
    const log: string[] = [];
    const context = createTransformContext(createDefaultOptions());
    const root = parseHtml('<div><p>a</p><span>b</span></div>');

    runTransforms(root, [tagRemover('span', log), tagRemover('p', log)], context);

    expect(log).toEqual(['span', 'p']);
    expect(stringifyHtml(root)).toBe('<div></div>');
    expect(context.stats.removedEmptyNodes).toBe(2);
  });

  it('returns the same tree instance without reparsing', () => {
    const context = createTransformContext(createDefaultOptions());
    const root = parseHtml('<p>a</p>');

    expect(runTransforms(root, [], context)).toBe(root);
  });

  it('keeps execution deterministic for identical input', () => {
    const build = (): string => {
      const log: string[] = [];
      const context = createTransformContext(createDefaultOptions());
      const root = parseHtml('<div><p>a</p><span>b</span></div>');

      runTransforms(root, [tagRemover('p', log), tagRemover('span', log)], context);

      return `${log.join(',')}|${stringifyHtml(root)}`;
    };

    expect(build()).toBe(build());
    expect(build()).toBe('p,span|<div></div>');
  });
});
