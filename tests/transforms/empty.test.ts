import type { Element } from 'hast';
import { describe, expect, it } from 'vitest';

import { createDefaultOptions } from '../../src/core/types';
import { isVoidElement } from '../../src/core/void-elements';
import { parseHtml } from '../../src/parser/parse';
import { isNodeEmpty, removeEmptyElements } from '../../src/transforms/empty';
import { runTransform } from '../helpers/run-transform';

const NBSP = '\u00a0';

/**
 * Read the first element child of a parsed fragment.
 *
 * @param {string} html - Fragment to parse.
 *
 * @returns {Element} First element node.
 */
function firstElement(html: string): Element {
  return parseHtml(html).children[0] as Element;
}

describe('isVoidElement', () => {
  it('recognizes the HTML void elements', () => {
    for (const tag of ['img', 'br', 'hr', 'input', 'meta', 'link', 'col']) {
      expect(isVoidElement(tag)).toBe(true);
    }
  });

  it('does not treat content elements as void', () => {
    for (const tag of ['p', 'div', 'span', 'td']) {
      expect(isVoidElement(tag)).toBe(false);
    }
  });
});

describe('isNodeEmpty', () => {
  it('treats an element without content as empty', () => {
    expect(isNodeEmpty(firstElement('<p></p>'), createDefaultOptions())).toBe(true);
  });

  it('treats whitespace-only content as empty', () => {
    expect(isNodeEmpty(firstElement('<p>   \n  </p>'), createDefaultOptions())).toBe(true);
  });

  it('keeps NBSP-only content unless removeEmptyNbsp is enabled', () => {
    const node = firstElement(`<p>${NBSP}</p>`);

    expect(isNodeEmpty(node, createDefaultOptions())).toBe(false);
    expect(isNodeEmpty(node, { ...createDefaultOptions(), removeEmptyNbsp: true })).toBe(true);
  });

  it('never treats void elements as empty', () => {
    expect(isNodeEmpty(firstElement('<img src="x.png">'), createDefaultOptions())).toBe(false);
  });

  it('keeps elements with nested content', () => {
    expect(isNodeEmpty(firstElement('<div><span>text</span></div>'), createDefaultOptions())).toBe(false);
  });
});

describe('removeEmptyElements', () => {
  it('removes empty elements but keeps void elements', () => {
    const result = runTransform('<div><p></p><br><span>text</span></div>', [removeEmptyElements()]);

    expect(result.html).toBe('<div><br><span>text</span></div>');
    expect(result.stats.removedEmptyNodes).toBe(1);
  });

  it('removes nested empty elements from the deepest level upward', () => {
    const result = runTransform('<div><section><span></span></section></div>', [removeEmptyElements()]);

    expect(result.html).toBe('');
    expect(result.stats.removedEmptyNodes).toBe(3);
  });

  it('keeps an element whose only child is void', () => {
    const result = runTransform('<p><img src="x.png"></p>', [removeEmptyElements()]);

    expect(result.html).toBe('<p><img src="x.png"></p>');
    expect(result.stats.removedEmptyNodes).toBe(0);
  });

  it('removes elements that only contain whitespace or NBSP text', () => {
    const result = runTransform(`<div> <p>${NBSP}</p> </div>`, [removeEmptyElements()], { removeEmptyNbsp: true });

    expect(result.html).toBe('');
  });

  it('leaves meaningful content untouched', () => {
    const result = runTransform('<p>Keep</p>', [removeEmptyElements()]);

    expect(result.html).toBe('<p>Keep</p>');
    expect(result.stats.removedEmptyNodes).toBe(0);
  });
});
