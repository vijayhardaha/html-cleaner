import { describe, expect, it } from 'vitest';

import { VERSION } from '../src/index';

describe('smoke', () => {
  it('exposes the library version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
