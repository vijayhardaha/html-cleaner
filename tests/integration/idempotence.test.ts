import { describe, expect, it } from 'vitest';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { cleanHtml } from '../../src/core/cleaner';
import { getPreset, listPresets } from '../../src/presets/index';

const FIXTURES = join(import.meta.dirname, '../fixtures');

const FIXTURE_NAMES = [
  'wordpress.html',
  'google-docs.html',
  'microsoft-word.html',
  'rich-text-editor.html',
  'copied-webpage.html',
  'messy-table.html',
  'heavily-nested.html',
];

describe('idempotence', () => {
  for (const presetName of listPresets()) {
    for (const fixture of FIXTURE_NAMES) {
      it(`cleaning twice with "${presetName}" equals cleaning once for ${fixture}`, async () => {
        const input = await readFile(join(FIXTURES, fixture), 'utf8');
        const options = getPreset(presetName);

        const once = cleanHtml(input, options).html;
        const twice = cleanHtml(once, options).html;

        expect(twice).toBe(once);
      });
    }
  }

  it('stays idempotent for remove-spans + remove-empty combinations', () => {
    const options = { removeSpans: true, removeEmpty: true, removeEmptyNbsp: true };
    const input = '<div><span> </span><p>keep</p><span>&nbsp;&nbsp;</span></div>';

    expect(cleanHtml(cleanHtml(input, options).html, options).html).toBe(cleanHtml(input, options).html);
  });

  it('stays idempotent for convert-bold + remove-attributes combinations', () => {
    const options = { convertBold: true, removeAttributes: true };
    const input = '<p class="x"><b class="y">bold</b></p>';

    expect(cleanHtml(cleanHtml(input, options).html, options).html).toBe(cleanHtml(input, options).html);
  });

  it('stays idempotent for collapse-nbsp + remove-empty combinations', () => {
    const options = { collapseNbsp: true, removeEmpty: true, removeEmptyNbsp: true };
    const input = '<p>a&nbsp;&nbsp;b</p><p>&nbsp;</p>';

    expect(cleanHtml(cleanHtml(input, options).html, options).html).toBe(cleanHtml(input, options).html);
  });

  it('stays idempotent with formatting and custom indentation', () => {
    const options = { format: true, indent: 4, newline: 'crlf' as const };
    const input = '<div><p>one</p><p>two</p></div>';

    expect(cleanHtml(cleanHtml(input, options).html, options).html).toBe(cleanHtml(input, options).html);
  });
});
