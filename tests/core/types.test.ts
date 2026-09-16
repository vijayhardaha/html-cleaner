import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS, createDefaultOptions } from '../../src/core/types';
import type { CleanerOptions } from '../../src/core/types';

const BOOLEAN_OPTION_KEYS = [
  'removeAttributes',
  'removeStyles',
  'removeClasses',
  'removeIds',
  'stripTags',
  'preserveBreaksWhenStripping',
  'collapseNbsp',
  'removeEmptyNbsp',
  'convertBold',
  'convertItalic',
  'removeEmpty',
  'removeSpans',
  'removeImages',
  'removeLinks',
  'removeTables',
  'tablesToDiv',
  'removeComments',
  'format',
  'finalNewline',
] as const;

describe('cleaner option defaults', () => {
  it('represents every boolean option', () => {
    for (const key of BOOLEAN_OPTION_KEYS) {
      expect(typeof DEFAULT_OPTIONS[key]).toBe('boolean');
    }
  });

  it('constructs defaults deterministically', () => {
    expect(createDefaultOptions()).toEqual(createDefaultOptions());
    expect(createDefaultOptions()).toEqual({ ...DEFAULT_OPTIONS });
  });

  it('keeps the documented conservative default cleanup', () => {
    expect(createDefaultOptions()).toMatchObject({
      removeComments: true,
      collapseNbsp: true,
      removeEmpty: true,
      convertBold: true,
      convertItalic: true,
      format: true,
      removeImages: false,
      removeLinks: false,
      removeTables: false,
      tablesToDiv: false,
      stripTags: false,
      removeAttributes: false,
      removeClasses: false,
      removeIds: false,
      removeStyles: false,
    });
  });

  it('freezes the shared defaults', () => {
    expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(true);

    expect(() => {
      (DEFAULT_OPTIONS as unknown as CleanerOptions).removeComments = false;
    }).toThrow();
  });

  it('returns a fresh object that cannot mutate shared defaults', () => {
    const options = createDefaultOptions();

    options.keepAttributes.push('data-keep');
    options.removeAttributeNames.push('title');
    options.removeComments = false;

    expect(DEFAULT_OPTIONS.keepAttributes).toEqual([]);
    expect(DEFAULT_OPTIONS.removeAttributeNames).toEqual([]);
    expect(DEFAULT_OPTIONS.removeComments).toBe(true);
  });
});
