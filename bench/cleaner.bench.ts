/**
 * ========================================================================
 * Cleaner benchmarks
 * ========================================================================
 * Purpose: Measure cleaning throughput on realistic fixtures and attribute
 *          time to a pipeline stage, so regressions are visible rather than
 *          guessed at.
 * Run:     bun run bench
 * ========================================================================
 *
 * This is a plain script rather than a `vitest bench` suite: Vitest 5 removed
 * the `bench()` API (neither exported nor provided as a global), so there is
 * no test-runner benchmarking hook to attach to. Running it under Bun keeps
 * TypeScript support without adding a benchmark dependency.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { buildTransforms, cleanHtml } from '../src/core/cleaner';
import { createTransformContext } from '../src/core/context';
import { runTransforms } from '../src/core/pipeline';
import { parseHtml } from '../src/parser/parse';
import { stringifyHtml } from '../src/parser/stringify';
import { getPreset } from '../src/presets/index';

/** Iterations discarded before timing, to let the JIT settle. */
const WARMUP = 3;

/**
 * One timed benchmark result.
 *
 * @property {string} label - Human-readable name of the measured operation.
 * @property {number} msPerOp - Mean milliseconds per iteration.
 * @property {number} opsPerSecond - Throughput derived from `msPerOp`.
 */
interface Measurement {
  label: string;
  msPerOp: number;
  opsPerSecond: number;
}

/**
 * Time a synchronous operation over a fixed number of iterations.
 *
 * @param {string} label - Name reported for the measurement.
 * @param {number} iterations - Number of timed iterations to run.
 * @param {() => void} run - Operation to measure.
 *
 * @returns {Measurement} Mean duration and derived throughput.
 */
function measure(label: string, iterations: number, run: () => void): Measurement {
  for (let i = 0; i < WARMUP; i += 1) {
    run();
  }

  const started = performance.now();

  for (let i = 0; i < iterations; i += 1) {
    run();
  }

  const msPerOp = (performance.now() - started) / iterations;

  return { label, msPerOp, opsPerSecond: 1000 / msPerOp };
}

/**
 * Render measurements as a fixed-width table.
 *
 * @param {Measurement[]} rows - Measurements to print.
 *
 * @returns {string} Table text without a trailing newline.
 */
function formatTable(rows: Measurement[]): string {
  const header = ['benchmark', 'ms/op', 'ops/sec'];
  const body = rows.map((row) => [row.label, row.msPerOp.toFixed(2), Math.round(row.opsPerSecond).toString()]);
  const widths = header.map((cell, index) => Math.max(cell.length, ...body.map((row) => (row[index] ?? '').length)));

  const line = (cells: string[]): string =>
    cells
      .map((cell, index) => cell.padEnd(widths[index] ?? 0))
      .join('  ')
      .trimEnd();

  return [line(header), line(widths.map((width) => '-'.repeat(width))), ...body.map(line)].join('\n');
}

/**
 * Load one benchmark fixture as UTF-8 text.
 *
 * @param {string} name - Fixture file name inside `bench/fixtures`.
 *
 * @returns {string} Fixture contents.
 */
function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');
}

/**
 * One fixture plus the iteration count that keeps its run time reasonable.
 *
 * @property {string} label - Fixture size label used in the report.
 * @property {string} html - Fixture contents.
 * @property {number} iterations - Timed iterations to run for this fixture.
 */
interface Fixture {
  label: string;
  html: string;
  iterations: number;
}

const SMALL: Fixture = { label: '10kb', html: fixture('10kb.html'), iterations: 200 };
const MEDIUM: Fixture = { label: '100kb', html: fixture('100kb.html'), iterations: 40 };
const LARGE: Fixture = { label: '1mb', html: fixture('1mb.html'), iterations: 4 };

const FIXTURES: ReadonlyArray<Fixture> = [SMALL, MEDIUM, LARGE];

console.log('End-to-end cleanHtml\n');

const endToEnd: Measurement[] = [];

for (const { label, html, iterations } of FIXTURES) {
  for (const preset of ['clean', 'aggressive'] as const) {
    const options = getPreset(preset);

    endToEnd.push(
      measure(`${label} --preset ${preset}`, iterations, () => {
        cleanHtml(html, options);
      })
    );
  }
}

console.log(formatTable(endToEnd));

// Stage breakdown on the mid-size fixture, so time can be attributed to a
// phase. The engine parses once, transforms once, and serializes once.
const mid = MEDIUM;
const options = getPreset('clean');
const transforms = buildTransforms(options);

console.log(`\nPipeline stages (${mid.label}, clean preset)\n`);

console.log(
  formatTable([
    measure('parse only', mid.iterations, () => {
      parseHtml(mid.html);
    }),
    measure('parse + serialize', mid.iterations, () => {
      stringifyHtml(parseHtml(mid.html));
    }),
    measure('parse + transforms', mid.iterations, () => {
      runTransforms(parseHtml(mid.html), transforms, createTransformContext(options));
    }),
    measure('full cleanHtml', mid.iterations, () => {
      cleanHtml(mid.html, options);
    }),
  ])
);
