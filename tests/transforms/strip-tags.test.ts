import { describe, expect, it } from 'vitest';

import { stripAllTags } from '../../src/transforms/strip-tags';
import { runTransform } from '../helpers/run-transform';

describe('stripAllTags without preserved breaks', () => {
  it('concatenates text content across block elements', () => {
    const result = runTransform('<h1>Title</h1><p>Hello<br>world</p>', [stripAllTags(false)]);

    expect(result.html).toBe('TitleHelloworld');
  });

  it('drops inline markup but keeps its text', () => {
    const result = runTransform('<p>a<span>b</span><b>c</b></p>', [stripAllTags(false)]);

    expect(result.html).toBe('abc');
  });

  it('returns text-only input unchanged', () => {
    const result = runTransform('plain text', [stripAllTags(false)]);

    expect(result.html).toBe('plain text');
  });
});

describe('stripAllTags with preserved breaks', () => {
  it('keeps block boundaries and br as readable line breaks', () => {
    const result = runTransform('<h1>Title</h1><p>Hello<br>world</p>', [stripAllTags(true)]);

    expect(result.html).toBe('Title\nHello\nworld');
  });

  it('separates list items by lines', () => {
    const result = runTransform('<ul><li>one</li><li>two</li></ul>', [stripAllTags(true)]);

    expect(result.html).toBe('one\ntwo');
  });

  it('keeps inline text glued together', () => {
    const result = runTransform('<p>a<span>b</span>c</p>', [stripAllTags(true)]);

    expect(result.html).toBe('abc');
  });

  it('adds no break for a block element without content', () => {
    const result = runTransform('<p></p><hr>', [stripAllTags(true)]);

    expect(result.html).toBe('');
    expect(result.root.children).toEqual([]);
  });
});

describe('stripAllTags and non-visible content', () => {
  it('drops script and style content instead of showing it', () => {
    const result = runTransform('<p>a</p><script>const x = 1 < 2;</script><style>p { color: red }</style>', [
      stripAllTags(true),
    ]);

    expect(result.html).toBe('a');
  });

  it('produces an empty tree for comments only', () => {
    const result = runTransform('<!--note-->', [stripAllTags(true)]);

    expect(result.html).toBe('');
    expect(result.root.children).toEqual([]);
  });
});
