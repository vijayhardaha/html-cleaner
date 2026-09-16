import { describe, expect, it } from 'vitest';

import { buildTransforms, cleanHtml, resolveOptions } from '../../src/core/cleaner';

describe('cleanHtml default behavior', () => {
  it('removes comments, converts semantic tags, and formats', () => {
    const result = cleanHtml('<p class="foo"><b>x</b></p><!--note-->');

    expect(result.html).toBe('<p class="foo"><strong>x</strong></p>\n');
    expect(result.stats.removedComments).toBe(1);
    expect(result.stats.convertedBold).toBe(1);
  });

  it('keeps destructive operations disabled by default', () => {
    const result = cleanHtml('<p class="a" id="b"><a href="/x">link</a><img src="x.png"></p>');

    expect(result.html).toBe('<p class="a" id="b"><a href="/x">link</a><img src="x.png"></p>\n');
    expect(result.stats.removedImages).toBe(0);
    expect(result.stats.unwrappedLinks).toBe(0);
  });

  it('merges partial options over the defaults', () => {
    const options = resolveOptions({ removeClasses: true });

    expect(options.removeClasses).toBe(true);
    expect(options.removeComments).toBe(true);
    expect(options.indent).toBe(2);
  });
});

describe('cleanHtml option combinations', () => {
  it('cleans the documented end-to-end example', () => {
    const result = cleanHtml('<p class="foo" style="color:red"><span><b>Hello</b></span>&nbsp;&nbsp;</p>', {
      removeStyles: true,
      removeClasses: true,
      removeSpans: true,
      convertBold: true,
      collapseNbsp: true,
      removeEmpty: true,
    });

    expect(result.html).toBe('<p><strong>Hello</strong> </p>\n');
  });

  it('combines span unwrapping with empty removal', () => {
    const result = cleanHtml('<div><span> </span></div>', { removeSpans: true, removeEmpty: true });

    expect(result.html).toBe('');
    expect(result.stats.unwrappedSpans).toBe(1);
    expect(result.stats.removedEmptyNodes).toBe(1);
  });

  it('combines bold conversion with attribute removal', () => {
    const result = cleanHtml('<p><b class="x" data-y="1">t</b></p>', { convertBold: true, removeAttributes: true });

    expect(result.html).toBe('<p><strong>t</strong></p>\n');
  });

  it('combines NBSP collapsing with empty removal', () => {
    const result = cleanHtml('<p>&nbsp;&nbsp;</p>', { collapseNbsp: true, removeEmpty: true });

    expect(result.html).toBe('');
  });

  it('counts attributes removed by name', () => {
    const result = cleanHtml('<p title="t" id="i">a</p>', { removeAttributeNames: ['title'] });

    expect(result.html).toBe('<p id="i">a</p>\n');
    expect(result.stats.removedAttributes).toBe(1);
  });

  it('strips tags with preserved breaks through the text preset behavior', () => {
    const result = cleanHtml('<h1>Title</h1><p>Hello<br>world</p>', {
      stripTags: true,
      preserveBreaksWhenStripping: true,
      convertBold: false,
      convertItalic: false,
      removeEmpty: false,
      format: false,
    });

    expect(result.html).toBe('Title\nHello\nworld');
  });
});

describe('cleanHtml table modes', () => {
  it('removes tables while keeping content', () => {
    const result = cleanHtml('<table><tr><td>a</td></tr></table>', { removeTables: true, format: false });

    expect(result.html).toBe('a');
    expect(result.stats.removedTableElements).toBe(4);
  });

  it('converts tables to divs when only tablesToDiv is enabled', () => {
    const result = cleanHtml('<table><tr><td>a</td></tr></table>', { tablesToDiv: true, format: false });

    expect(result.html).toBe('<div><div><div><div>a</div></div></div></div>');
  });

  it('never runs both table modes together', () => {
    const result = cleanHtml('<table><tr><td>a</td></tr></table>', {
      removeTables: true,
      tablesToDiv: true,
      format: false,
    });

    expect(result.html).toBe('a');
    expect(result.stats.convertedTableElements).toBe(0);
    expect(result.stats.removedTableElements).toBe(4);
  });
});

describe('cleanHtml formatting options', () => {
  it('omits the trailing newline when disabled', () => {
    expect(cleanHtml('<p>x</p>', { finalNewline: false }).html).toBe('<p>x</p>');
  });

  it('writes CRLF output when requested', () => {
    expect(cleanHtml('<div><p>a</p></div>', { newline: 'crlf' }).html).toBe('<div>\r\n  <p>a</p>\r\n</div>\r\n');
  });

  it('skips formatting when disabled', () => {
    expect(cleanHtml('<div><p>a</p></div>', { format: false }).html).toBe('<div><p>a</p></div>');
  });
});

describe('buildTransforms', () => {
  it('orders transforms deterministically for the same options', () => {
    const options = resolveOptions({ removeSpans: true, removeLinks: true, removeImages: true });

    expect(buildTransforms(options).map((transform) => transform.name)).toEqual(
      buildTransforms(options).map((transform) => transform.name)
    );
  });

  it('returns only enabled transforms in execution order', () => {
    const names = buildTransforms(
      resolveOptions({
        removeComments: false,
        collapseNbsp: false,
        convertBold: false,
        convertItalic: false,
        removeEmpty: false,
        format: false,
      })
    ).map((transform) => transform.name);

    expect(names).toEqual([]);
  });
});
