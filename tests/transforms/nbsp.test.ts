import { describe, expect, it } from 'vitest';

import { normalizeNbsp } from '../../src/transforms/nbsp';
import { runTransform } from '../helpers/run-transform';

const NBSP = '\u00a0';

describe('normalizeNbsp', () => {
  it('collapses repeated entities into one regular space', () => {
    const result = runTransform(`<p>a&nbsp;&nbsp;b</p>`, [normalizeNbsp()]);

    expect(result.html).toBe('<p>a b</p>');
    expect(result.stats.normalizedNbspNodes).toBe(1);
  });

  it('normalizes literal non-breaking space characters', () => {
    const result = runTransform(`<p>x${NBSP}${NBSP}${NBSP}y</p>`, [normalizeNbsp()]);

    expect(result.html).toBe('<p>x y</p>');
    expect(result.stats.normalizedNbspNodes).toBe(1);
  });

  it('leaves regular spacing and mixed content readable', () => {
    const result = runTransform(`<p>keep ${NBSP} spaced</p>`, [normalizeNbsp()]);

    expect(result.html).toBe('<p>keep   spaced</p>');
  });

  it('normalizes NBSP-only nodes into a single space', () => {
    const result = runTransform(`<p>${NBSP}</p>`, [normalizeNbsp()]);

    expect(result.html).toBe('<p> </p>');
    expect(result.stats.normalizedNbspNodes).toBe(1);
  });

  it('does not create double-encoded entities', () => {
    const result = runTransform(`<p>&nbsp;${NBSP}</p>`, [normalizeNbsp()]);

    expect(result.html).toBe('<p> </p>');
    expect(result.html).not.toContain('&amp;nbsp;');
  });

  it('ignores text without non-breaking spaces', () => {
    const result = runTransform('<p>plain</p>', [normalizeNbsp()]);

    expect(result.html).toBe('<p>plain</p>');
    expect(result.stats.normalizedNbspNodes).toBe(0);
  });
});
