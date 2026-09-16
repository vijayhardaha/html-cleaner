import { describe, expect, it } from 'vitest';

import { CliUsageError, parseArgs } from '../../src/cli/args';

describe('parseArgs input and output modes', () => {
  it('parses a single input path', () => {
    const parsed = parseArgs(['input.html']);

    expect(parsed.input).toBe('input.html');
    expect(parsed.overrides).toEqual({});
  });

  it('parses -o/--output', () => {
    expect(parseArgs(['-o', 'out.html']).output).toBe('out.html');
    expect(parseArgs(['--output', 'out.html']).output).toBe('out.html');
  });

  it('parses -w/--write', () => {
    expect(parseArgs(['-w', 'in.html']).write).toBe(true);
    expect(parseArgs(['--write', 'in.html']).write).toBe(true);
  });

  it('parses --check, --report, --stdin, and --stdout', () => {
    expect(parseArgs(['--check']).check).toBe(true);
    expect(parseArgs(['--report']).report).toBe(true);
    expect(parseArgs(['--stdin']).stdin).toBe(true);
    expect(parseArgs(['--stdout']).stdout).toBe(true);
  });

  it('parses --preset with a valid name', () => {
    expect(parseArgs(['--preset', 'clean']).preset).toBe('clean');
  });

  it('parses --config', () => {
    expect(parseArgs(['--config', 'cleaner.json']).config).toBe('cleaner.json');
  });
});

describe('parseArgs transformation flags', () => {
  it('collects every boolean cleaning flag as an override', () => {
    const parsed = parseArgs([
      '--remove-attributes',
      '--remove-styles',
      '--remove-classes',
      '--remove-ids',
      '--strip-tags',
      '--preserve-breaks',
      '--remove-empty-nbsp',
      '--convert-bold',
      '--convert-italic',
      '--remove-spans',
      '--remove-images',
      '--remove-links',
      '--remove-tables',
      '--tables-to-div',
      '--remove-comments',
    ]);

    expect(parsed.overrides).toEqual({
      removeAttributes: true,
      removeStyles: true,
      removeClasses: true,
      removeIds: true,
      stripTags: true,
      preserveBreaksWhenStripping: true,
      removeEmptyNbsp: true,
      convertBold: true,
      convertItalic: true,
      removeSpans: true,
      removeImages: true,
      removeLinks: true,
      removeTables: true,
      tablesToDiv: true,
      removeComments: true,
    });
  });

  it('maps --collapse-nbsp and --remove-empty onto their cleaner options', () => {
    const parsed = parseArgs(['--collapse-nbsp', '--remove-empty']);

    expect(parsed.overrides.collapseNbsp).toBe(true);
    expect(parsed.overrides.removeEmpty).toBe(true);
  });

  it('maps --format and --no-final-newline', () => {
    const formatted = parseArgs(['--format']);

    expect(formatted.overrides.format).toBe(true);

    const unformatted = parseArgs(['--no-final-newline']);

    expect(unformatted.overrides.finalNewline).toBe(false);
  });

  it('does not emit overrides for flags that were not passed', () => {
    const parsed = parseArgs(['in.html']);

    expect(parsed.overrides).toEqual({});
  });

  it('collects repeated --keep-attr and --remove-attr values', () => {
    const parsed = parseArgs([
      '--keep-attr',
      'href',
      '--keep-attr',
      'src',
      '--remove-attr',
      'title',
      '--remove-attr',
      'lang',
    ]);

    expect(parsed.overrides.keepAttributes).toEqual(['href', 'src']);
    expect(parsed.overrides.removeAttributeNames).toEqual(['title', 'lang']);
  });

  it('parses --indent with a number and with "tab"', () => {
    expect(parseArgs(['--indent', '4']).overrides.indent).toBe(4);
    expect(parseArgs(['--indent', '0']).overrides.indent).toBe(0);
    expect(parseArgs(['--indent', 'tab']).overrides.indent).toBe('tab');
  });

  it('parses --newline with lf and crlf', () => {
    expect(parseArgs(['--newline', 'lf']).overrides.newline).toBe('lf');
    expect(parseArgs(['--newline', 'crlf']).overrides.newline).toBe('crlf');
  });
});

describe('parseArgs validation errors', () => {
  it('rejects an unknown preset', () => {
    expect(() => parseArgs(['--preset', 'nope'])).toThrow(CliUsageError);
    expect(() => parseArgs(['--preset', 'nope'])).toThrow(/expected one of/);
  });

  it('rejects a non-integer indent', () => {
    expect(() => parseArgs(['--indent', '1.5'])).toThrow(CliUsageError);
  });

  it('rejects a negative indent', () => {
    expect(() => parseArgs(['--indent', '-2'])).toThrow(CliUsageError);
  });

  it('rejects an invalid newline value', () => {
    expect(() => parseArgs(['--newline', 'space'])).toThrow(CliUsageError);
  });

  it('reports the offending value in the error message', () => {
    expect(() => parseArgs(['--indent', 'many'])).toThrow(/got "many"/);
  });
});
