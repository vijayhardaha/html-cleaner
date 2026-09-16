import { describe, expect, it } from 'vitest';

import { removeAttributes, removeNamedAttributes } from '../../src/transforms/attributes';
import { runTransform } from '../helpers/run-transform';

describe('removeAttributes', () => {
  it('removes every attribute when no keep list is given', () => {
    const result = runTransform('<a href="/x" title="t" class="c">link</a>', [removeAttributes()]);

    expect(result.html).toBe('<a>link</a>');
    expect(result.stats.removedAttributes).toBe(3);
  });

  it('preserves attributes listed in keepAttributes', () => {
    const result = runTransform('<a href="/x" title="t" data-id="1">link</a>', [removeAttributes()], {
      keepAttributes: ['href', 'data-id'],
    });

    expect(result.html).toBe('<a href="/x" data-id="1">link</a>');
    expect(result.stats.removedAttributes).toBe(1);
  });

  it('matches attribute names case-insensitively for known attributes', () => {
    const result = runTransform('<img alt="a" src="x.png">', [removeAttributes()], { keepAttributes: ['SRC'] });

    expect(result.html).toBe('<img src="x.png">');
    expect(result.stats.removedAttributes).toBe(1);
  });

  it('keeps camelCased HAST property names through their attribute name', () => {
    const result = runTransform('<div class="a" id="b">x</div>', [removeAttributes()], { keepAttributes: ['class'] });

    expect(result.html).toBe('<div class="a">x</div>');
  });
});

describe('removeNamedAttributes', () => {
  it('removes only the requested attributes', () => {
    const result = runTransform('<p title="t" data-x="1" id="i">a</p>', [removeNamedAttributes()], {
      removeAttributeNames: ['title', 'data-x'],
    });

    expect(result.html).toBe('<p id="i">a</p>');
    expect(result.stats.removedAttributes).toBe(2);
  });

  it('does nothing when no names are configured', () => {
    const result = runTransform('<p title="t">a</p>', [removeNamedAttributes()]);

    expect(result.html).toBe('<p title="t">a</p>');
    expect(result.stats.removedAttributes).toBe(0);
  });
});
