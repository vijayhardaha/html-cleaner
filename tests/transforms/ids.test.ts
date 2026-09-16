import { describe, expect, it } from 'vitest';

import { removeIds } from '../../src/transforms/ids';
import { runTransform } from '../helpers/run-transform';

describe('removeIds', () => {
  it('removes id attributes and keeps other attributes', () => {
    const result = runTransform('<h1 id="title" class="c">Title</h1>', [removeIds()]);

    expect(result.html).toBe('<h1 class="c">Title</h1>');
    expect(result.stats.removedIds).toBe(1);
  });

  it('ignores elements without ids', () => {
    const result = runTransform('<p>a</p>', [removeIds()]);

    expect(result.html).toBe('<p>a</p>');
    expect(result.stats.removedIds).toBe(0);
  });
});
