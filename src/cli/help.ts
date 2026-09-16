/**
 * ========================================================================
 * CLI help text
 * ========================================================================
 * Purpose: Names, descriptions, and exit codes shared by the argument
 *          parser and the help output.
 * ========================================================================
 */

/** Executable name used in help and error messages. */
export const CLI_NAME = 'html-cleaner';

/** Version reported by `--version`; keep in sync with package.json. */
export const CLI_VERSION = '0.1.0';

/** One-line description shown at the top of `--help`. */
export const CLI_DESCRIPTION = 'Clean HTML markup from a file or stdin.';

/** Epilogue documenting presets and exit codes. */
export const CLI_EPILOGUE = [
  'Presets: safe, clean, article, aggressive, text',
  '',
  'Exit codes:',
  '  0  success',
  '  1  input, output, or config error',
  '  2  invalid usage',
  '  4  --check found differences',
  '',
  'This tool normalizes markup; it is not a security sanitizer.',
].join('\n');

/** Exit code used when arguments are invalid. */
export const EXIT_USAGE = 2;

/** Exit code used for input, output, and configuration failures. */
export const EXIT_FAILURE = 1;

/** Exit code used by `--check` when cleaning would change the input. */
export const EXIT_DIFFERENCES = 4;

/** Option descriptions, grouped the way the help output presents them. */
export const OPTION_HELP = {
  output: 'Write the cleaned HTML to a file',
  write: 'Modify the input file in place',
  stdin: 'Read HTML from stdin explicitly',
  stdout: 'Write cleaned HTML to stdout explicitly',
  check: 'Exit 4 when cleaning would change the input',
  report: 'Print cleanup statistics to stderr',
  preset: 'Apply a named option preset',
  config: 'Read options from a JSON configuration file',
  removeAttributes: 'Remove all attributes except those kept by --keep-attr',
  keepAttr: 'Attribute name preserved by --remove-attributes (repeatable)',
  removeAttr: 'Attribute name removed explicitly (repeatable)',
  removeStyles: 'Remove style attributes',
  removeClasses: 'Remove class attributes',
  removeIds: 'Remove id attributes',
  stripTags: 'Strip all element markup and keep text',
  preserveBreaks: 'Keep readable line breaks when stripping tags',
  collapseNbsp: 'Collapse non-breaking spaces into regular spaces',
  removeEmptyNbsp: 'Treat whitespace/NBSP-only nodes as empty',
  convertBold: 'Convert <b> to <strong>',
  convertItalic: 'Convert <i> to <em>',
  removeEmpty: 'Remove non-void elements without content',
  removeSpans: 'Unwrap <span> elements',
  removeImages: 'Remove <img> elements',
  removeLinks: 'Unwrap <a> elements',
  removeTables: 'Remove table structure and keep content',
  tablesToDiv: 'Convert table elements to nested divs',
  removeComments: 'Remove HTML comments',
  format: 'Format output deterministically',
  indent: 'Indentation: a number of spaces or "tab"',
  newline: 'Line ending: "lf" or "crlf"',
  noFinalNewline: 'Do not append a trailing newline',
} as const;
