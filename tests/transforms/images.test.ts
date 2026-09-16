import { describe, expect, it } from 'vitest';

import { removeImages } from '../../src/transforms/images';
import { runTransform } from '../helpers/run-transform';

describe('removeImages', () => {
  it('removes image elements', () => {
    const result = runTransform('<p>before<img src="x.png" alt="x">after</p>', [removeImages()]);

    expect(result.html).toBe('<p>beforeafter</p>');
    expect(result.stats.removedImages).toBe(1);
  });

  it('removes every image in nested content', () => {
    const result = runTransform('<div><p><img src="a.png"></p><img src="b.png"></div>', [removeImages()]);

    expect(result.html).toBe('<div><p></p></div>');
    expect(result.stats.removedImages).toBe(2);
  });

  it('leaves documents without images unchanged', () => {
    const result = runTransform('<p>text</p>', [removeImages()]);

    expect(result.html).toBe('<p>text</p>');
    expect(result.stats.removedImages).toBe(0);
  });
});
