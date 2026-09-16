import { describe, expect, it } from 'vitest';

import { removeSpans } from '../../src/transforms/spans';
import { runTransform } from '../helpers/run-transform';

describe('removeSpans', () => {
  it('unwraps a span and keeps its text', () => {
    const result = runTransform('<p><span>text</span></p>', [removeSpans()]);

    expect(result.html).toBe('<p>text</p>');
    expect(result.stats.unwrappedSpans).toBe(1);
  });

  it('keeps nested children and sibling content', () => {
    const result = runTransform('<div><span>a<b>c</b></span>tail</div>', [removeSpans()]);

    expect(result.html).toBe('<div>a<b>c</b>tail</div>');
    expect(result.stats.unwrappedSpans).toBe(1);
  });

  it('unwraps repeated and nested spans in one pass', () => {
    const result = runTransform('<span><span>deep</span></span><span>sibling</span>', [removeSpans()]);

    expect(result.html).toBe('deepsibling');
    expect(result.stats.unwrappedSpans).toBe(3);
  });

  it('discards span attributes together with the wrapper', () => {
    const result = runTransform('<span class="a" style="color:red">x</span>', [removeSpans()]);

    expect(result.html).toBe('x');
  });
});
