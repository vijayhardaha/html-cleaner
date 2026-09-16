/**
 * ========================================================================
 * CLI argument parsing
 * ========================================================================
 * Purpose: Translates command-line arguments into cleaner options, keeping
 *          parsing separate from cleaning business logic.
 * ========================================================================
 */

import { Command, CommanderError, InvalidArgumentError } from 'commander';

import { CLI_DESCRIPTION, CLI_EPILOGUE, CLI_NAME, CLI_VERSION, OPTION_HELP } from './help';
import type { CleanerOptions } from '../core/types';
import type { PresetName } from '../presets/index';
import { PRESET_NAMES, isPresetName } from '../presets/index';

/** Error raised for invalid usage; the CLI maps it to exit code 2. */
export class CliUsageError extends Error {}

/** Error raised when the process should exit cleanly, for example after `--help`. */
export class CliExitRequested extends Error {
  /** Exit code the CLI should return. */
  readonly exitCode: number;

  /**
   * Create an exit request.
   *
   * @param {number} exitCode - Exit code the CLI should return.
   */
  constructor(exitCode: number) {
    super('CLI requested exit');
    this.exitCode = exitCode;
  }
}

/**
 * Options parsed from the command line.
 *
 * @property {string} [input] - Input file path, when one was given.
 * @property {string} [output] - Output file path from `--output`.
 * @property {boolean} write - Whether `--write` was given.
 * @property {boolean} check - Whether `--check` was given.
 * @property {boolean} report - Whether `--report` was given.
 * @property {boolean} stdin - Whether `--stdin` was given.
 * @property {boolean} stdout - Whether `--stdout` was given.
 * @property {PresetName} [preset] - Selected preset name.
 * @property {string} [config] - Configuration file path from `--config`.
 * @property {Partial<CleanerOptions>} overrides - Cleaner options collected from flags.
 */
export interface ParsedCliOptions {
  input?: string;
  output?: string;
  write: boolean;
  check: boolean;
  report: boolean;
  stdin: boolean;
  stdout: boolean;
  preset?: PresetName;
  config?: string;
  overrides: Partial<CleanerOptions>;
}

/** Boolean flags that map directly onto cleaner options. */
const BOOLEAN_FLAGS: ReadonlyArray<{ flag: string; key: keyof CleanerOptions; description: string }> = [
  { flag: '--remove-attributes', key: 'removeAttributes', description: OPTION_HELP.removeAttributes },
  { flag: '--remove-styles', key: 'removeStyles', description: OPTION_HELP.removeStyles },
  { flag: '--remove-classes', key: 'removeClasses', description: OPTION_HELP.removeClasses },
  { flag: '--remove-ids', key: 'removeIds', description: OPTION_HELP.removeIds },
  { flag: '--strip-tags', key: 'stripTags', description: OPTION_HELP.stripTags },
  { flag: '--preserve-breaks', key: 'preserveBreaksWhenStripping', description: OPTION_HELP.preserveBreaks },
  { flag: '--collapse-nbsp', key: 'collapseNbsp', description: OPTION_HELP.collapseNbsp },
  { flag: '--remove-empty-nbsp', key: 'removeEmptyNbsp', description: OPTION_HELP.removeEmptyNbsp },
  { flag: '--convert-bold', key: 'convertBold', description: OPTION_HELP.convertBold },
  { flag: '--convert-italic', key: 'convertItalic', description: OPTION_HELP.convertItalic },
  { flag: '--remove-empty', key: 'removeEmpty', description: OPTION_HELP.removeEmpty },
  { flag: '--remove-spans', key: 'removeSpans', description: OPTION_HELP.removeSpans },
  { flag: '--remove-images', key: 'removeImages', description: OPTION_HELP.removeImages },
  { flag: '--remove-links', key: 'removeLinks', description: OPTION_HELP.removeLinks },
  { flag: '--remove-tables', key: 'removeTables', description: OPTION_HELP.removeTables },
  { flag: '--tables-to-div', key: 'tablesToDiv', description: OPTION_HELP.tablesToDiv },
  { flag: '--remove-comments', key: 'removeComments', description: OPTION_HELP.removeComments },
  { flag: '--format', key: 'format', description: OPTION_HELP.format },
  { flag: '--no-final-newline', key: 'finalNewline', description: OPTION_HELP.noFinalNewline },
];

/**
 * Parse an `--indent` value.
 *
 * @param {string} value - Raw argument value.
 *
 * @returns {number | 'tab'} Indentation width or the tab marker.
 *
 * @throws {InvalidArgumentError} When the value is not a non-negative integer or "tab".
 */
function parseIndent(value: string): number | 'tab' {
  if (value === 'tab') {
    return 'tab';
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new InvalidArgumentError(`expected a non-negative integer or "tab", got "${value}"`);
  }

  return parsed;
}

/**
 * Parse a `--preset` value.
 *
 * @param {string} value - Raw argument value.
 *
 * @returns {PresetName} Validated preset name.
 *
 * @throws {InvalidArgumentError} When the value is not a known preset name.
 */
function parsePreset(value: string): PresetName {
  if (!isPresetName(value)) {
    throw new InvalidArgumentError(`expected one of ${PRESET_NAMES.join(', ')}, got "${value}"`);
  }

  return value;
}

/**
 * Parse a `--newline` value.
 *
 * @param {string} value - Raw argument value.
 *
 * @returns {'lf' | 'crlf'} Validated newline style.
 *
 * @throws {InvalidArgumentError} When the value is neither "lf" nor "crlf".
 */
function parseNewline(value: string): 'lf' | 'crlf' {
  if (value !== 'lf' && value !== 'crlf') {
    throw new InvalidArgumentError(`expected "lf" or "crlf", got "${value}"`);
  }

  return value;
}

/**
 * Collect a repeatable option value.
 *
 * @param {string} value - Raw argument value.
 * @param {string[]} previous - Values collected so far.
 *
 * @returns {string[]} Updated collection.
 */
function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

/**
 * Build the Commander program used by the CLI.
 *
 * @returns {Command} Configured program instance.
 */
function createProgram(): Command {
  const program = new Command();

  program
    .name(CLI_NAME)
    .description(CLI_DESCRIPTION)
    .version(CLI_VERSION, '-V, --version', 'Print the version number')
    .argument('[input]', 'Input HTML file; stdin is used when omitted')
    .addHelpText('after', `\n${CLI_EPILOGUE}`)
    .option('-o, --output <file>', OPTION_HELP.output)
    .option('-w, --write', OPTION_HELP.write, false)
    .option('--stdin', OPTION_HELP.stdin, false)
    .option('--stdout', OPTION_HELP.stdout, false)
    .option('--check', OPTION_HELP.check, false)
    .option('--report', OPTION_HELP.report, false)
    .option('--preset <name>', OPTION_HELP.preset, parsePreset)
    .option('--config <file>', OPTION_HELP.config)
    .option('--keep-attr <name>', OPTION_HELP.keepAttr, collect, [] as string[])
    .option('--remove-attr <name>', OPTION_HELP.removeAttr, collect, [] as string[])
    .option('--indent <number|tab>', OPTION_HELP.indent, parseIndent)
    .option('--newline <lf|crlf>', OPTION_HELP.newline, parseNewline);

  for (const { flag, description } of BOOLEAN_FLAGS) {
    program.option(flag, description, false);
  }

  program.exitOverride();
  program.configureOutput({ writeErr: () => undefined });

  return program;
}

/**
 * Parse CLI arguments into cleaner options.
 *
 * @param {string[]} argv - Arguments without the node and script entries.
 *
 * @returns {ParsedCliOptions} Parsed options ready for the CLI flow.
 *
 * @throws {CliUsageError} When arguments are invalid.
 * @throws {CliExitRequested} When `--help` or `--version` was requested.
 */
export function parseArgs(argv: string[]): ParsedCliOptions {
  const program = createProgram();

  try {
    program.parse(argv, { from: 'user' });
  } catch (error) {
    if (error instanceof CommanderError) {
      if (error.code === 'commander.helpDisplayed' || error.code === 'commander.version') {
        throw new CliExitRequested(0);
      }

      throw new CliUsageError(error.message.replace(/^error: /, ''));
    }

    throw error;
  }

  const options = program.opts();
  const overrides: Partial<CleanerOptions> = {};

  for (const { flag, key } of BOOLEAN_FLAGS) {
    // Commander keys negated flags by their positive attribute name: `--no-final-newline` is stored as `finalNewline`.
    const optionKey = flag
      .replace(/^--no-/, '')
      .replace(/^--/, '')
      .replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase());

    if (program.getOptionValueSource(optionKey) === 'cli') {
      overrides[key] = options[optionKey];
    }
  }

  if (options.indent !== undefined) {
    overrides.indent = options.indent;
  }

  if (options.newline !== undefined) {
    overrides.newline = options.newline;
  }

  if (options.keepAttr.length > 0) {
    overrides.keepAttributes = options.keepAttr;
  }

  if (options.removeAttr.length > 0) {
    overrides.removeAttributeNames = options.removeAttr;
  }

  return {
    input: program.args[0],
    output: options.output,
    write: options.write,
    check: options.check,
    report: options.report,
    stdin: options.stdin,
    stdout: options.stdout,
    preset: options.preset,
    config: options.config,
    overrides,
  };
}
