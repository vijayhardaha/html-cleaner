import { describe, expect, it } from 'vitest';

import { removeComments } from '../../src/transforms/comments';
import { runTransform } from '../helpers/run-transform';

describe('removeComments', () => {
  it('removes a single comment', () => {
    const result = runTransform('<p>a</p><!--note-->', [removeComments()]);

    expect(result.html).toBe('<p>a</p>');
    expect(result.stats.removedComments).toBe(1);
  });

  it('removes comments between nodes and nested comments', () => {
    const result = runTransform('<div><!--outer--><p>a</p><!--inner--><span>b</span><!--tail--></div>', [
      removeComments(),
    ]);

    expect(result.html).toBe('<div><p>a</p><span>b</span></div>');
    expect(result.stats.removedComments).toBe(3);
  });

  it('leaves a document without comments untouched', () => {
    const result = runTransform('<p>a</p>', [removeComments()]);

    expect(result.html).toBe('<p>a</p>');
    expect(result.stats.removedComments).toBe(0);
  });
});
