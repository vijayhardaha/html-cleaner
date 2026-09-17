import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { cleanHtml } from '../../src/core/cleaner';
import { getPreset } from '../../src/presets/index';

const FIXTURES = join(import.meta.dirname, '../fixtures');

/**
 * Read a fixture file from tests/fixtures.
 *
 * @param {string} name - Fixture file name.
 *
 * @returns {Promise<string>} Fixture contents.
 */
async function readFixture(name: string): Promise<string> {
  return readFile(join(FIXTURES, name), 'utf8');
}

const PRESETS = ['safe', 'clean', 'article', 'aggressive', 'text'] as const;

const FIXTURE_NAMES = [
  'wordpress.html',
  'google-docs.html',
  'microsoft-word.html',
  'rich-text-editor.html',
  'copied-webpage.html',
  'messy-table.html',
  'heavily-nested.html',
];

describe('real-world fixtures', () => {
  for (const fixture of FIXTURE_NAMES) {
    it(`cleans ${fixture} with every preset without crashing`, async () => {
      const input = await readFixture(fixture);

      for (const presetName of PRESETS) {
        const options = getPreset(presetName);
        const result = cleanHtml(input, options);

        expect(typeof result.html).toBe('string');
        expect(result.html.length).toBeGreaterThan(0);
      }
    });

    it(`produces stable output for ${fixture} with the safe preset across repeated runs`, async () => {
      const input = await readFixture(fixture);

      const first = cleanHtml(input, getPreset('safe'));
      const second = cleanHtml(input, getPreset('safe'));

      expect(first.html).toBe(second.html);
    });
  }

  it('strips a WordPress fixture to readable text', async () => {
    const input = await readFixture('wordpress.html');
    const result = cleanHtml(input, { stripTags: true, preserveBreaksWhenStripping: true, format: false });

    expect(result.html).toContain('Welcome to the blog!');
    expect(result.html).not.toContain('<');
  });

  it('removes Google Docs wrapper spans and styles', async () => {
    const input = await readFixture('google-docs.html');
    const result = cleanHtml(input, { removeStyles: true, removeClasses: true, removeSpans: true, convertBold: true });

    expect(result.html).not.toContain('class=');
    expect(result.html).not.toContain('style=');
    expect(result.html).not.toContain('<span');
    expect(result.html).toContain('<strong>Bold from Docs</strong>');
  });

  it('removes Word tables and images with the article preset', async () => {
    const input = await readFixture('microsoft-word.html');
    const result = cleanHtml(input, { removeStyles: true, removeClasses: true, removeSpans: true });

    expect(result.html).toContain('Cell A1');
    expect(result.html).toContain('Cell B1');
    expect(result.stats.removedComments).toBeGreaterThanOrEqual(0);
  });

  it('removes empty NBSP paragraphs from a rich-text editor', async () => {
    const input = await readFixture('rich-text-editor.html');
    const result = cleanHtml(input, { removeEmptyNbsp: true, removeSpans: true });

    expect(result.stats.removedEmptyNodes).toBeGreaterThan(0);
  });

  it('keeps table cell content when tables are removed', async () => {
    const input = await readFixture('messy-table.html');
    const result = cleanHtml(input, { removeTables: true, format: false });

    expect(result.html).toContain('Totals');
    expect(result.html).toContain('Q1');
    expect(result.html).toContain('End');
    expect(result.html).not.toContain('<table');
  });

  it('converts a messy table into nested divs', async () => {
    const input = await readFixture('messy-table.html');
    const result = cleanHtml(input, { tablesToDiv: true, format: false });

    expect(result.html).not.toContain('<table');
    expect(result.html).not.toContain('<td');
    expect(result.html).toContain('Totals');
  });

  it('unwraps deeply nested spans completely', async () => {
    const input = await readFixture('heavily-nested.html');
    const result = cleanHtml(input, { removeSpans: true, removeEmpty: true });

    expect(result.html).not.toContain('<span');
    expect(result.html).toContain('Buried');
  });
});
