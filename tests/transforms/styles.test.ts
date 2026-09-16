import { describe, expect, it } from 'vitest';

import { removeStyles } from '../../src/transforms/styles';
import { runTransform } from '../helpers/run-transform';

describe('removeStyles', () => {
  it('removes inline style attributes and keeps other attributes', () => {
    const result = runTransform('<p style="color: red" class="c">a</p>', [removeStyles()]);

    expect(result.html).toBe('<p class="c">a</p>');
    expect(result.stats.removedStyles).toBe(1);
  });

  it('handles nested elements and repeated runs', () => {
    const result = runTransform('<div style="a: 1"><p style="b: 2">x</p></div>', [removeStyles(), removeStyles()]);

    expect(result.html).toBe('<div><p>x</p></div>');
    expect(result.stats.removedStyles).toBe(2);
  });
});
