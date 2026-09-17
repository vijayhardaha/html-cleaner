import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadConfig } from '../../src/config/load';
import { mergeOptions } from '../../src/config/merge';
import { createDefaultOptions } from '../../src/core/types';
import type { CleanerOptions } from '../../src/core/types';

/**
 * Read a JSON config file written into a fresh temporary directory.
 *
 * @param {string} content - JSON content written to the config file.
 *
 * @returns {Promise<string>} Path of the written config file.
 */
async function writeTempConfig(content: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'html-cleaner-config-'));
  const filePath = join(directory, 'cleaner.json');

  await writeFile(filePath, content, 'utf8');

  return filePath;
}

describe('loadConfig', () => {
  it('loads a valid JSON config', async () => {
    const filePath = await writeTempConfig('{"removeClasses": true, "indent": 4}');

    try {
      await expect(loadConfig(filePath)).resolves.toEqual({ removeClasses: true, indent: 4 });
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('rejects a missing file with an explicit error', async () => {
    const missing = join(tmpdir(), 'html-cleaner-missing-config.json');

    await expect(loadConfig(missing)).rejects.toThrow('Unable to read config file');
  });

  it('reports malformed JSON with the file path and parse error', async () => {
    const filePath = await writeTempConfig('{"removeClasses": true,,}');

    try {
      await expect(loadConfig(filePath)).rejects.toThrow('Invalid JSON in config file');
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('rejects non-object JSON documents', async () => {
    const filePath = await writeTempConfig('[1, 2, 3]');

    try {
      await expect(loadConfig(filePath)).rejects.toThrow('must contain a JSON object');
    } finally {
      await rm(filePath, { force: true });
    }
  });

  it('rejects invalid enumerated values', async () => {
    const filePath = await writeTempConfig('{"indent": "wide"}');

    try {
      await expect(loadConfig(filePath)).rejects.toThrow('Invalid');
    } finally {
      await rm(filePath, { force: true });
    }
  });
});

describe('mergeOptions precedence', () => {
  it('applies defaults → preset → config → CLI', () => {
    const defaults = createDefaultOptions();
    const preset = { removeStyles: true, removeClasses: true };
    const config = { removeClasses: false, indent: 4 };
    const cli = { removeComments: false };

    const merged = mergeOptions(defaults, preset, config, cli);

    expect(merged.removeComments).toBe(false);
    expect(merged.removeStyles).toBe(true);
    expect(merged.removeClasses).toBe(false);
    expect(merged.indent).toBe(4);
    expect(merged.collapseNbsp).toBe(true);
  });

  it('keeps defaults for untouched options', () => {
    const merged = mergeOptions(createDefaultOptions(), {}, {}, {});

    expect(merged).toEqual(createDefaultOptions());
  });

  it('replaces arrays instead of concatenating them', () => {
    const merged = mergeOptions(
      createDefaultOptions(),
      {},
      { keepAttributes: ['class'] },
      { keepAttributes: ['href'] }
    );

    expect(merged.keepAttributes).toEqual(['href']);
  });

  it('ignores undefined entries from later sources', () => {
    const merged = mergeOptions(createDefaultOptions(), {}, { removeIds: true }, { removeIds: undefined });

    expect(merged.removeIds).toBe(true);
  });

  it('rejects invalid merged enum values', () => {
    const defaults = createDefaultOptions();

    expect(() => mergeOptions(defaults, {}, { newline: 'tabs' as CleanerOptions['newline'] }, {})).toThrow(
      'Invalid merged value for "newline"'
    );
  });

  it('rejects invalid indent values with the right source label', () => {
    const defaults = createDefaultOptions();

    expect(() => mergeOptions(defaults, {}, { indent: -2 }, {})).toThrow('Invalid merged value for "indent"');
  });

  it('returns fresh arrays so inputs cannot be mutated through the result', () => {
    const config = { removeAttributeNames: ['title'] };
    const merged = mergeOptions(createDefaultOptions(), {}, config, {});

    merged.removeAttributeNames.push('data-x');

    expect(config.removeAttributeNames).toEqual(['title']);
  });
});
