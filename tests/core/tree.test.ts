import type { Element, RootContent } from 'hast';
import { describe, expect, it } from 'vitest';

import { attributeName, isComment, isElement, isText, removeProperty, visitContent } from '../../src/core/tree';
import { parseHtml } from '../../src/parser/parse';

/**
 * Parse a fragment and return its first node.
 *
 * @param {string} html - Fragment to parse.
 *
 * @returns {RootContent} First node of the parsed fragment.
 */
function firstNode(html: string): RootContent {
  return parseHtml(html).children[0];
}

/**
 * Parse a single element out of a fragment.
 *
 * @param {string} html - Fragment whose first node is an element.
 *
 * @returns {Element} Parsed element node.
 */
function firstElement(html: string): Element {
  return firstNode(html) as Element;
}

describe('node narrowing helpers', () => {
  it('recognizes element nodes', () => {
    expect(isElement(firstNode('<p>x</p>'))).toBe(true);
    expect(isElement(firstNode('text'))).toBe(false);
  });

  it('treats a missing node as not an element', () => {
    expect(isElement(undefined)).toBe(false);
  });

  it('recognizes text nodes', () => {
    expect(isText(firstNode('text'))).toBe(true);
    expect(isText(firstNode('<p>x</p>'))).toBe(false);
  });

  it('recognizes comment nodes', () => {
    expect(isComment(firstNode('<!--note-->'))).toBe(true);
    expect(isComment(firstNode('<p>x</p>'))).toBe(false);
  });
});

describe('visitContent', () => {
  it('keeps, drops, and expands children according to the mapper', () => {
    const container = firstElement('<div><p>a</p><span>b</span><em>c</em></div>');

    visitContent(container, (node) => {
      if (isElement(node) && node.tagName === 'span') {
        return null;
      }

      if (isElement(node) && node.tagName === 'em') {
        return [
          { type: 'text', value: 'x' },
          { type: 'text', value: 'y' },
        ];
      }

      return node;
    });

    expect(container.children.map((child) => child.type)).toEqual(['element', 'text', 'text']);
  });

  it('maps replacement elements again so nested unwrapping settles in one pass', () => {
    const container = firstElement('<div><section><p>a</p></section></div>');
    const section = container.children[0];

    visitContent(container, (node) => (node === section ? (section as Element).children[0] : node));

    expect(container.children).toHaveLength(1);
    expect((container.children[0] as Element).tagName).toBe('p');
  });
});

describe('attributeName', () => {
  it('maps a HAST property key back to its HTML attribute name', () => {
    expect(attributeName('className')).toBe('class');
  });

  it('falls back to the key itself for unknown properties', () => {
    expect(attributeName('notAProperty')).toBe('notAProperty');
  });
});

describe('removeProperty', () => {
  it('removes an existing property', () => {
    const element = firstElement('<p class="x">a</p>');

    expect(removeProperty(element, 'className')).toBe(true);
    expect(element.properties.className).toBeUndefined();
  });

  it('reports when the property was absent', () => {
    const element = firstElement('<p>a</p>');

    expect(removeProperty(element, 'className')).toBe(false);
  });
});
