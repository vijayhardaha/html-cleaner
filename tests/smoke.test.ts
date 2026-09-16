import { describe, expect, it } from 'vitest';

import { cleanHtml, createDefaultOptions } from '../src/index';

describe('smoke', () => {
  it('cleans HTML through the public API', () => {
    const result = cleanHtml('<p><b>Hello</b></p>');

    expect(result.html).toContain('<strong>Hello</strong>');
    expect(result.stats.convertedBold).toBe(1);
  });

  it('exposes default options through the public API', () => {
    expect(createDefaultOptions().removeComments).toBe(true);
  });
});
