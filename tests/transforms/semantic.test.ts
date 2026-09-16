import { describe, expect, it } from 'vitest';

import { createDefaultOptions } from '../../src/core/types';
import { convertSemanticTags } from '../../src/transforms/semantic';
import { runTransform } from '../helpers/run-transform';

describe('convertSemanticTags', () => {
  it('converts b to strong and i to em', () => {
    const result = runTransform('<p><b>bold</b> and <i>italic</i></p>', [
      ...convertSemanticTags({ ...createDefaultOptions(), convertBold: true, convertItalic: true }),
    ]);

    expect(result.html).toBe('<p><strong>bold</strong> and <em>italic</em></p>');
    expect(result.stats.convertedBold).toBe(1);
    expect(result.stats.convertedItalic).toBe(1);
  });

  it('keeps nested children while renaming', () => {
    const result = runTransform('<b><i>both</i> and <span>text</span></b>', [
      ...convertSemanticTags({ ...createDefaultOptions(), convertBold: true, convertItalic: true }),
    ]);

    expect(result.html).toBe('<strong><em>both</em> and <span>text</span></strong>');
  });

  it('leaves unrelated tags untouched', () => {
    const result = runTransform('<p><strong>a</strong><em>b</em></p>', [
      ...convertSemanticTags({ ...createDefaultOptions(), convertBold: true, convertItalic: true }),
    ]);

    expect(result.html).toBe('<p><strong>a</strong><em>b</em></p>');
    expect(result.stats.convertedBold).toBe(0);
    expect(result.stats.convertedItalic).toBe(0);
  });

  it('returns only the enabled transforms', () => {
    const options = createDefaultOptions();

    expect(convertSemanticTags({ ...options, convertBold: true, convertItalic: false }).map((t) => t.name)).toEqual([
      'semantic-bold',
    ]);
    expect(convertSemanticTags({ ...options, convertBold: false, convertItalic: false })).toEqual([]);
  });
});
