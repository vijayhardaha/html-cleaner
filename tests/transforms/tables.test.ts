import { describe, expect, it } from 'vitest';

import { createTransformContext } from '../../src/core/context';
import { createDefaultOptions } from '../../src/core/types';
import { removeTables, tablesToDivs } from '../../src/transforms/tables';
import { runTransform } from '../helpers/run-transform';

describe('removeTables', () => {
  it('unwraps a simple table and keeps cell content', () => {
    // The HTML parser inserts an implicit tbody between table and tr.
    const result = runTransform('<table><tr><td>a</td><td>b</td></tr></table>', [removeTables()]);

    expect(result.html).toBe('ab');
    expect(result.stats.removedTableElements).toBe(5);
  });

  it('handles thead, tbody, tfoot, and th', () => {
    const result = runTransform(
      '<table><thead><tr><th>H</th></tr></thead><tbody><tr><td>1</td></tr></tbody><tfoot><tr><td>F</td></tr></tfoot></table>',
      [removeTables()]
    );

    expect(result.html).toBe('H1F');
    expect(result.stats.removedTableElements).toBe(10);
  });

  it('keeps nested content and order', () => {
    const result = runTransform('<table><tbody><tr><td><p>one</p></td><td><b>two</b></td></tr></tbody></table>', [
      removeTables(),
    ]);

    expect(result.html).toBe('<p>one</p><b>two</b>');
  });

  it('removes rowspan and colspan attributes together with the structure', () => {
    const result = runTransform('<table><tr><td rowspan="2" colspan="3">x</td></tr></table>', [removeTables()]);

    expect(result.html).toBe('x');
  });

  it('drops col and colgroup, which carry no content', () => {
    const result = runTransform('<table><colgroup><col span="2"></colgroup><tr><td>a</td></tr></table>', [
      removeTables(),
    ]);

    expect(result.html).toBe('a');
    expect(result.stats.removedTableElements).toBe(6);
  });

  it('keeps caption text', () => {
    const result = runTransform('<table><caption>Title</caption><tr><td>a</td></tr></table>', [removeTables()]);

    expect(result.html).toBe('Titlea');
  });
});
it('keeps inter-tag whitespace when no context is supplied', () => {
  const result = runTransform('<div>\n  <table>\n    <tr><td>a</td></tr>\n  </table>\n</div>', [removeTables()]);

  expect(result.html).toBe('<div>\n  \n    a\n  \n</div>');
});

it('keeps inter-tag whitespace when collapseNbsp is off', () => {
  const context = createTransformContext({ ...createDefaultOptions(), collapseNbsp: false });
  const result = runTransform('<div>\n  <table>\n    <tr><td>a</td></tr>\n  </table>\n</div>', [removeTables(context)]);

  expect(result.html).toBe('<div>\n  \n    a\n  \n</div>');
});

it('drops inter-tag whitespace when collapseNbsp is on', () => {
  const context = createTransformContext({ ...createDefaultOptions(), collapseNbsp: true });
  const result = runTransform('<div>\n  <table>\n    <tr><td>a</td></tr>\n  </table>\n</div>', [removeTables(context)]);

  expect(result.html).toBe('<div>\n  a\n</div>');
});

it('keeps cell text that mixes whitespace with content', () => {
  const context = createTransformContext({ ...createDefaultOptions(), collapseNbsp: true });
  const result = runTransform('<table><tr><td> a </td></tr></table>', [removeTables(context)]);

  expect(result.html).toBe(' a ');
});

it('drops whitespace-only text inside a cell when collapseNbsp is on', () => {
  const context = createTransformContext({ ...createDefaultOptions(), collapseNbsp: true });
  const result = runTransform('<table><tr><td>\n  <b>x</b>\n</td></tr></table>', [removeTables(context)]);

  expect(result.html).toBe('<b>x</b>');
});

describe('tablesToDivs', () => {
  it('renames table elements to div while keeping hierarchy', () => {
    // table > tbody > tr > td: the parser supplies tbody.
    const result = runTransform('<table><tr><td>a</td></tr></table>', [tablesToDivs()]);

    expect(result.html).toBe('<div><div><div><div>a</div></div></div></div>');
    expect(result.stats.convertedTableElements).toBe(4);
  });

  it('keeps attributes and rowspan/colspan data on the renamed elements', () => {
    const result = runTransform('<table><tr><td colspan="2">a</td></tr></table>', [tablesToDivs()]);

    expect(result.html).toBe('<div><div><div><div colspan="2">a</div></div></div></div>');
  });

  it('renames thead, tbody, tfoot, th, caption, colgroup, and col', () => {
    const result = runTransform(
      '<table><caption>c</caption><colgroup><col></colgroup><thead><tr><th>h</th></tr></thead></table>',
      [tablesToDivs()]
    );

    expect(result.html).toBe('<div><div>c</div><div><div></div></div><div><div><div>h</div></div></div></div>');
    expect(result.stats.convertedTableElements).toBe(7);
  });
});
