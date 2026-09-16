import type { Element, Root, Text } from 'hast';
import { describe, expect, it } from 'vitest';

import { parseHtml } from '../../src/parser/parse';

describe('parseHtml', () => {
  it('parses nested elements without wrapping them in html/body', () => {
    const root: Root = parseHtml('<div class="wrap"><p>Hi</p></div>');

    expect(root.type).toBe('root');
    expect(root.children).toHaveLength(1);

    const div = root.children[0] as Element;

    expect(div.type).toBe('element');
    expect(div.tagName).toBe('div');
    expect(div.properties).toEqual({ className: ['wrap'] });
    expect((div.children[0] as Element).tagName).toBe('p');
    expect(((div.children[0] as Element).children[0] as Text).value).toBe('Hi');
  });

  it('parses plain text fragments', () => {
    const root = parseHtml('just text');

    expect(root.children).toHaveLength(1);
    expect(root.children[0]).toMatchObject({ type: 'text', value: 'just text' });
  });

  it('parses comments', () => {
    const root = parseHtml('<p>a</p><!--note--><p>b</p>');

    expect(root.children.map((child) => child.type)).toEqual(['element', 'comment', 'element']);
  });

  it('decodes character references into text', () => {
    const root = parseHtml('<p>&nbsp;&amp;</p>');
    const paragraph = root.children[0] as Element;
    const text = paragraph.children[0] as Text;

    expect(text.value).toBe('\u00a0&');
  });

  it('repairs malformed but parseable HTML', () => {
    const root = parseHtml('<p>unclosed<div>block');

    expect(root.children.map((child) => (child as Element).tagName)).toEqual(['p', 'div']);
    expect(((root.children[1] as Element).children[0] as Text).value).toBe('block');
  });
});
