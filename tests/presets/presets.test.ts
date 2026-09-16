import { describe, expect, it } from 'vitest';

import { getPreset, getPresetValues, isPresetName, listPresets } from '../../src/presets/index';
import { createDefaultOptions } from '../../src/core/types';
import type { CleanerOptions } from '../../src/core/types';
import type { PresetName } from '../../src/presets/index';

/** Expected stored values for every preset, taken from the plan definitions. */
const EXPECTED_PRESET_VALUES: Record<string, Partial<CleanerOptions>> = {
  safe: {
    removeComments: true,
    collapseNbsp: true,
    removeEmpty: true,
    convertBold: true,
    convertItalic: true,
    format: true,
  },
  clean: {
    removeComments: true,
    removeStyles: true,
    removeClasses: true,
    removeIds: true,
    collapseNbsp: true,
    removeEmptyNbsp: true,
    convertBold: true,
    convertItalic: true,
    removeEmpty: true,
    format: true,
  },
  article: {
    removeComments: true,
    removeStyles: true,
    removeClasses: true,
    removeIds: true,
    collapseNbsp: true,
    removeEmptyNbsp: true,
    convertBold: true,
    convertItalic: true,
    removeEmpty: true,
    removeSpans: true,
    removeImages: true,
    removeLinks: true,
    format: true,
  },
  aggressive: {
    removeComments: true,
    removeAttributes: true,
    collapseNbsp: true,
    removeEmptyNbsp: true,
    convertBold: true,
    convertItalic: true,
    removeEmpty: true,
    removeSpans: true,
    removeImages: true,
    removeLinks: true,
    removeTables: true,
    format: true,
  },
  text: { stripTags: true, preserveBreaksWhenStripping: true, collapseNbsp: true, removeComments: true, format: false },
};

describe('presets', () => {
  it('lists presets in documentation order', () => {
    expect(listPresets()).toEqual(['safe', 'clean', 'article', 'aggressive', 'text']);
  });

  it('recognizes valid preset names and rejects others', () => {
    expect(isPresetName('safe')).toBe(true);
    expect(isPresetName('text')).toBe(true);
    expect(isPresetName('unknown')).toBe(false);
    expect(isPresetName('')).toBe(false);
  });

  for (const name of Object.keys(EXPECTED_PRESET_VALUES) as PresetName[]) {
    it(`stores exactly the documented values for "${name}"`, () => {
      expect(getPresetValues(name)).toEqual(EXPECTED_PRESET_VALUES[name]);
    });
  }

  it('resolves presets over the defaults', () => {
    const safe = getPreset('safe');

    expect(safe.removeComments).toBe(true);
    expect(safe.removeImages).toBe(false);
    expect(safe.indent).toBe(2);
    expect(safe.newline).toBe('lf');
  });

  it('resolves the text preset with formatting disabled', () => {
    const text = getPreset('text');

    expect(text.format).toBe(false);
    expect(text.stripTags).toBe(true);
    expect(text.preserveBreaksWhenStripping).toBe(true);
  });

  it('returns fresh copies so stored presets cannot be mutated', () => {
    const first = getPreset('clean');
    const second = getPreset('clean');

    first.removeClasses = false;
    first.removeStyles = false;

    expect(second.removeClasses).toBe(true);
    expect(second.removeStyles).toBe(true);
  });

  it('resolves every preset into a complete option set', () => {
    const defaults = createDefaultOptions();

    for (const name of listPresets()) {
      const resolved: CleanerOptions = getPreset(name);

      for (const key of Object.keys(defaults) as (keyof CleanerOptions)[]) {
        expect(resolved[key]).toBeDefined();
      }
    }
  });

  it('throws for an unknown preset name', () => {
    expect(() => getPresetValues('missing' as PresetName)).toThrow('Unknown preset "missing"');
  });
});
