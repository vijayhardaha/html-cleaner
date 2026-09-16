import { describe, expect, it } from 'vitest';

import { removeClasses } from '../../src/transforms/classes';
import { runTransform } from '../helpers/run-transform';

describe('removeClasses', () => {
  it('removes class attributes and keeps other attributes', () => {
    const result = runTransform('<p class="a b" id="i">x</p>', [removeClasses()]);

    expect(result.html).toBe('<p id="i">x</p>');
    expect(result.stats.removedClasses).toBe(1);
  });

  it('counts every affected element', () => {
    const result = runTransform('<div class="a"><span class="b">x</span></div>', [removeClasses()]);

    expect(result.html).toBe('<div><span>x</span></div>');
    expect(result.stats.removedClasses).toBe(2);
  });
});
