import { describe, expect, it } from 'vitest';

import { createDefaultOptions } from '../../src/core/types';
import { formatHtml } from '../../src/formatter/format';
import { parseHtml } from '../../src/parser/parse';
import { stringifyHtml } from '../../src/parser/stringify';
import { tablesToDivs } from '../../src/transforms/tables';
import { runTransform } from '../helpers/run-transform';

/**
 * Format an HTML fragment with the given overrides.
 *
 * @param {string} html - Fragment to format.
 * @param {Partial<import('../../src/core/types').FormatOptions>} overrides - Formatter overrides.
 *
 * @returns {string} Serialized formatted HTML.
 */
function format(html: string, overrides: Partial<import('../../src/core/types').FormatOptions> = {}): string {
  const options = { ...createDefaultOptions(), ...overrides };
  const root = parseHtml(html);

  formatHtml(root, options);

  return stringifyHtml(root);
}

describe('formatHtml indentation', () => {
  it('indents nested block elements with two spaces', () => {
    expect(format('<div><section><p>a</p></section></div>')).toBe(
      '<div>\n  <section>\n    <p>a</p>\n  </section>\n</div>'
    );
  });

  it('supports tab indentation', () => {
    expect(format('<div><p>a</p></div>', { indent: 'tab' })).toBe('<div>\n\t<p>a</p>\n</div>');
  });

  it('supports a custom indentation width', () => {
    expect(format('<div><p>a</p></div>', { indent: 4 })).toBe('<div>\n    <p>a</p>\n</div>');
  });

  it('formats lists and tables-converted-to-divs', () => {
    expect(format('<ul><li>one</li><li>two</li></ul>')).toBe('<ul>\n  <li>one</li>\n  <li>two</li>\n</ul>');
    expect(format(runTransform('<table><tr><td>a</td></tr></table>', [tablesToDivs()]).html)).toBe(
      '<div>\n  <div>\n    <div>\n      <div>a</div>\n    </div>\n  </div>\n</div>'
    );
  });
});

describe('formatHtml whitespace rules', () => {
  it('keeps inline children exactly as authored', () => {
    expect(format('<p>a <b>b</b> c</p>')).toBe('<p>a <b>b</b> c</p>');
  });

  it('keeps inline-only documents untouched', () => {
    expect(format('<span>a</span> text')).toBe('<span>a</span> text');
  });

  it('leaves preformatted content untouched', () => {
    expect(format('<div><pre>a\n  b</pre></div>')).toBe('<div>\n  <pre>a\n  b</pre>\n</div>');
  });

  it('normalizes existing indentation whitespace between blocks', () => {
    expect(format('<div>\n      <p>a</p>\n   <p>b</p>\n</div>')).toBe('<div>\n  <p>a</p>\n  <p>b</p>\n</div>');
  });

  it('keeps text-only output unchanged', () => {
    expect(format('plain text')).toBe('plain text');
  });
});

describe('formatHtml newline styles', () => {
  it('writes CRLF line endings when requested', () => {
    expect(format('<div><p>a</p></div>', { newline: 'crlf' })).toBe('<div>\r\n  <p>a</p>\r\n</div>');
  });

  it('writes LF line endings by default', () => {
    expect(format('<div><p>a</p></div>')).toContain('\n');
    expect(format('<div><p>a</p></div>')).not.toContain('\r');
  });
});
