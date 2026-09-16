import { describe, expect, it } from 'vitest';

import { removeLinks } from '../../src/transforms/links';
import { runTransform } from '../helpers/run-transform';

describe('removeLinks', () => {
  it('unwraps an anchor and keeps its text', () => {
    const result = runTransform('<p><a href="/page">link</a></p>', [removeLinks()]);

    expect(result.html).toBe('<p>link</p>');
    expect(result.stats.unwrappedLinks).toBe(1);
  });

  it('keeps element children while unwrapping', () => {
    const result = runTransform('<a href="/x"><strong>bold</strong> text</a>', [removeLinks()]);

    expect(result.html).toBe('<strong>bold</strong> text');
  });

  it('unwraps nested anchors found in the tree', () => {
    const result = runTransform('<p><a href="/a">one</a> and <a href="/b">two</a></p>', [removeLinks()]);

    expect(result.html).toBe('<p>one and two</p>');
    expect(result.stats.unwrappedLinks).toBe(2);
  });
});
