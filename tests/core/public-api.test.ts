import { describe, expect, it } from 'vitest';

import { DEFAULT_OPTIONS, cleanHtml, createDefaultOptions } from '../../src/index';
import type { AttributeOptions, CleanResult, CleanerOptions, FormatOptions, TransformStats } from '../../src/index';

describe('public library API', () => {
  it('exposes the cleaner function', () => {
    const result = cleanHtml('<p><b>Hello</b></p>');

    expect(typeof cleanHtml).toBe('function');
    expect(result.html).toContain('<strong>Hello</strong>');
  });

  it('exposes immutable defaults and a factory', () => {
    const options = createDefaultOptions();

    expect(options).toEqual({ ...DEFAULT_OPTIONS });
    expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(true);
  });

  it('keeps returned statistics complete', () => {
    const result: CleanResult = cleanHtml('<p>x</p>');

    const counters: (keyof TransformStats)[] = [
      'removedComments',
      'removedAttributes',
      'removedStyles',
      'removedClasses',
      'removedIds',
      'removedEmptyNodes',
      'removedImages',
      'unwrappedLinks',
      'unwrappedSpans',
      'convertedBold',
      'convertedItalic',
      'removedTableElements',
      'convertedTableElements',
      'normalizedNbspNodes',
    ];

    for (const counter of counters) {
      expect(typeof result.stats[counter]).toBe('number');
    }
  });

  it('keeps option groups usable as standalone types', () => {
    const attributeOptions: AttributeOptions = { removeAttributes: true, keepAttributes: [], removeAttributeNames: [] };
    const formatOptions: FormatOptions = { format: true, indent: 'tab', newline: 'lf', finalNewline: false };
    const options: CleanerOptions = { ...createDefaultOptions(), ...attributeOptions, ...formatOptions };

    expect(options.indent).toBe('tab');
  });
});
