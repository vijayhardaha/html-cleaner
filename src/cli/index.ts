#!/usr/bin/env node
/**
 * ========================================================================
 * html-cleaner CLI
 * ========================================================================
 * Purpose: Executable entry point. Parses arguments, resolves preset,
 *          config, and CLI options, reads input, cleans, then writes output
 *          or reports differences with a defined exit code.
 * ========================================================================
 */

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { CliExitRequested, CliUsageError, parseArgs } from './args';
import type { ParsedCliOptions } from './args';
import { CLI_NAME, EXIT_DIFFERENCES, EXIT_FAILURE, EXIT_USAGE, OPTION_HELP } from './help';
import { assertSafeOutputTarget, readInput, readStdin, writeOutput } from './io';
import { formatReport } from './report';
import { loadConfig } from '../config/load';
import { mergeOptions } from '../config/merge';
import { cleanHtml } from '../core/cleaner';
import { createDefaultOptions } from '../core/types';
import { getPresetValues } from '../presets/index';

/**
 * Process interfaces the CLI writes to and reads from.
 *
 * @property {(text: string) => void} stdout - Writer for standard output.
 * @property {(text: string) => void} stderr - Writer for standard error.
 * @property {() => Promise<string>} readStdin - Reader for standard input.
 */
export interface CliEnvironment {
  stdout(text: string): void;
  stderr(text: string): void;
  readStdin(): Promise<string>;
}

/**
 * Create the environment backed by the real process streams.
 *
 * @returns {CliEnvironment} Environment bound to process stdio.
 */
export function createProcessEnvironment(): CliEnvironment {
  return {
    stdout: (text) => {
      process.stdout.write(text);
    },
    stderr: (text) => {
      process.stderr.write(text);
    },
    readStdin: () => readStdin(),
  };
}

/**
 * Reject contradictory input/output mode combinations.
 *
 * @param {ParsedCliOptions} parsed - Parsed arguments.
 *
 * @throws {CliUsageError} When the requested modes cannot be combined.
 */
function assertConsistentModes(parsed: ParsedCliOptions): void {
  if (parsed.write && parsed.output !== undefined) {
    throw new CliUsageError('--write and --output cannot be combined');
  }

  if (parsed.stdout && parsed.output !== undefined) {
    throw new CliUsageError('--stdout and --output cannot be combined');
  }

  if (parsed.write && parsed.input === undefined) {
    throw new CliUsageError('--write requires an input file');
  }

  if (parsed.write && parsed.stdin) {
    throw new CliUsageError('--write cannot be combined with --stdin');
  }
}

/**
 * Resolve the effective options from presets, config, and CLI flags.
 *
 * @param {ParsedCliOptions} parsed - Parsed arguments.
 *
 * @returns {Promise<import('../core/types').CleanerOptions>} Resolved options.
 *
 * @throws {Error} When the configuration file cannot be read or is invalid.
 */
async function resolveRunOptions(parsed: ParsedCliOptions): Promise<import('../core/types').CleanerOptions> {
  const config = parsed.config === undefined ? {} : await loadConfig(parsed.config);
  const preset = parsed.preset === undefined ? {} : getPresetValues(parsed.preset);

  return mergeOptions(createDefaultOptions(), preset, config, parsed.overrides);
}

/**
 * Run the CLI for one invocation.
 *
 * @param {string[]} argv - Arguments without node and script entries.
 * @param {CliEnvironment} [environment] - Stream environment, injectable for tests.
 *
 * @returns {Promise<number>} Exit code: 0 success, 1 failure, 2 usage, 4 differences.
 */
export async function runCli(
  argv: string[],
  environment: CliEnvironment = createProcessEnvironment()
): Promise<number> {
  let parsed: ParsedCliOptions;

  try {
    parsed = parseArgs(argv);
    assertConsistentModes(parsed);
  } catch (error) {
    if (error instanceof CliExitRequested) {
      return error.exitCode;
    }

    // parseArgs only raises CliExitRequested or CliUsageError; this rethrow is defensive.
    /* v8 ignore next 3 */
    if (!(error instanceof CliUsageError)) {
      throw error;
    }

    environment.stderr(`${CLI_NAME}: ${error.message}\nRun "${CLI_NAME} --help" for usage.\n`);

    return EXIT_USAGE;
  }

  try {
    const options = await resolveRunOptions(parsed);
    const input = parsed.input === undefined ? await environment.readStdin() : await readInput(parsed.input);
    const result = cleanHtml(input, options);

    if (parsed.report) {
      environment.stderr(`${formatReport(result.stats)}\n`);
    }

    if (parsed.check) {
      if (result.html !== input) {
        environment.stderr(`${CLI_NAME}: input would be changed by cleaning.\n`);

        return EXIT_DIFFERENCES;
      }

      return 0;
    }

    if (parsed.write) {
      await writeOutput(result.html, parsed.input, true);

      return 0;
    }

    if (parsed.output !== undefined) {
      assertSafeOutputTarget(parsed.input, parsed.output, false);
      await writeOutput(result.html, parsed.output);

      return 0;
    }

    environment.stdout(result.html);

    return 0;
  } catch (error) {
    environment.stderr(`${CLI_NAME}: ${(error as Error).message}\n`);

    return EXIT_FAILURE;
  }
}

/** Flag describing whether stdin can be used in place of an input path. */
export const STDIN_HINT = OPTION_HELP.stdin;

// Entry-point guard below only runs when this file is executed as a binary, never when it is
// imported, so it cannot be covered from tests. It is exercised for real by the built bundle:
// see tests/cli/bin-symlink.test.ts, which spawns dist/cli/index.cjs through a .bin symlink.
/* v8 ignore start */

/**
 * Detect whether this module is the process entry point.
 *
 * Package managers run a bin through a symlink in `node_modules/.bin`, so `process.argv[1]`
 * is the symlink path while `import.meta.url` is the resolved real path. Comparing the two
 * directly would never match and the CLI would exit silently, so both sides are canonicalized.
 *
 * @returns {boolean} True when this module was launched directly rather than imported.
 */
function isMainModule(): boolean {
  const entry = process.argv[1];

  if (entry === undefined) {
    return false;
  }

  const self = fileURLToPath(import.meta.url);

  try {
    return realpathSync(entry) === realpathSync(self);
  } catch {
    return entry === self;
  }
}

const isMain = isMainModule();

if (isMain) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}

/* v8 ignore stop */
