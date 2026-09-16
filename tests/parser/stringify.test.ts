import { describe, expect, it } from 'vitest';

import { parseHtml } from '../../src/parser/parse';
import { stringifyHtml } from '../../src/parser/stringify';

describe('stringifyHtml', () => {
  it('round-trips element structure and attributes', () => {
    const html = '<div class="a"><p title="t">Hi</p></div>';

    expect(stringifyHtml(parseHtml(html))).toBe(html);
  });

  it('escapes text content that would otherwise be markup', () => {
    expect(stringifyHtml(parseHtml('<p>a &amp; b &lt;c&gt;</p>'))).toBe('<p>a &#x26; b &#x3C;c></p>');
  });

  it('keeps comments in the output', () => {
    expect(stringifyHtml(parseHtml('<p>a</p><!--note-->'))).toBe('<p>a</p><!--note-->');
  });

  it('serializes void elements without closing tags', () => {
    expect(stringifyHtml(parseHtml('<p>a<br>b</p>'))).toBe('<p>a<br>b</p>');
  });

  it('keeps non-breaking spaces as characters rather than entities', () => {
    expect(stringifyHtml(parseHtml('<p>&nbsp;</p>'))).toBe('<p>\u00a0</p>');
  });

  it('preserves semantics for text-only input', () => {
    expect(stringifyHtml(parseHtml('plain text'))).toBe('plain text');
  });
});
