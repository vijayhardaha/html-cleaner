/**
 * ========================================================================
 * Cleanup report
 * ========================================================================
 * Purpose: Deterministic, human-readable statistics for `--report`.
 * ========================================================================
 */

import type { TransformStats } from '../core/types';

/** Report rows in a stable order. */
const REPORT_ROWS: ReadonlyArray<{ key: keyof TransformStats; label: string }> = [
  { key: 'removedComments', label: 'comments removed' },
  { key: 'removedAttributes', label: 'attributes removed' },
  { key: 'removedStyles', label: 'styles removed' },
  { key: 'removedClasses', label: 'classes removed' },
  { key: 'removedIds', label: 'ids removed' },
  { key: 'removedEmptyNodes', label: 'empty elements removed' },
  { key: 'removedImages', label: 'images removed' },
  { key: 'unwrappedLinks', label: 'links unwrapped' },
  { key: 'unwrappedSpans', label: 'spans unwrapped' },
  { key: 'convertedBold', label: 'bold conversions' },
  { key: 'convertedItalic', label: 'italic conversions' },
  { key: 'removedTableElements', label: 'table elements removed' },
  { key: 'convertedTableElements', label: 'table elements converted' },
  { key: 'normalizedNbspNodes', label: 'nbsp nodes normalized' },
];

/**
 * Format cleanup statistics for humans.
 *
 * @param {TransformStats} stats - Statistics collected for one run.
 *
 * @returns {string} Multi-line report without a trailing newline.
 */
export function formatReport(stats: TransformStats): string {
  const rows = REPORT_ROWS.map(({ key, label }) => `  ${label}: ${stats[key]}`);

  return ['html-cleaner report', ...rows].join('\n');
}
