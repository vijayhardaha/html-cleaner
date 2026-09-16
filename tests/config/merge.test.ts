import { describe, expect, it } from 'vitest';

import { mergeOptions } from '../../src/config/merge';
import { createDefaultOptions } from '../../src/core/types';
import type { CleanerOptions } from '../../src/core/types';

describe('mergeOptions validation', () => {
  it('accepts "tab" for indent', () => {
    const merged = mergeOptions(createDefaultOptions(), {}, { indent: 'tab' }, {});

    expect(merged.indent).toBe('tab');
  });

  it('accepts zero for indent', () => {
    const merged = mergeOptions(createDefaultOptions(), {}, { indent: 0 }, {});

    expect(merged.indent).toBe(0);
  });

  it('rejects non-integer indent', () => {
    const options = { indent: 1.5 } as Partial<CleanerOptions>;

    expect(() => mergeOptions(createDefaultOptions(), {}, options, {})).toThrow('indent');
  });

  it('rejects unknown newline values', () => {
    const options = { newline: 'space' } as unknown as Partial<CleanerOptions>;

    expect(() => mergeOptions(createDefaultOptions(), {}, options, {})).toThrow('newline');
  });

  it('labels merged failures correctly when the CLI source is invalid', () => {
    const options = { indent: 'huge' } as unknown as Partial<CleanerOptions>;

    expect(() => mergeOptions(createDefaultOptions(), {}, {}, options)).toThrow('Invalid merged value for "indent"');
  });
});
