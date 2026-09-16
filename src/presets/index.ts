/**
 * ========================================================================
 * Presets
 * ========================================================================
 * Purpose: Named option bundles for common cleaning intents, kept separate
 *          from the cleaner engine so presets stay testable and immutable.
 * ========================================================================
 */

import { AGGRESSIVE_PRESET } from './aggressive';
import { ARTICLE_PRESET } from './article';
import { CLEAN_PRESET } from './clean';
import { SAFE_PRESET } from './safe';
import { TEXT_PRESET } from './text';
import type { CleanerOptions } from '../core/types';
import { createDefaultOptions } from '../core/types';

/** Names of the presets the CLI and library understand. */
export type PresetName = 'safe' | 'clean' | 'article' | 'aggressive' | 'text';

/** Preset names in documentation order. */
export const PRESET_NAMES: readonly PresetName[] = ['safe', 'clean', 'article', 'aggressive', 'text'];

/** Stored preset definitions; treat these as immutable. */
const PRESETS: Record<PresetName, Readonly<Partial<CleanerOptions>>> = {
  safe: SAFE_PRESET,
  clean: CLEAN_PRESET,
  article: ARTICLE_PRESET,
  aggressive: AGGRESSIVE_PRESET,
  text: TEXT_PRESET,
};

/**
 * List the available preset names.
 *
 * @returns {PresetName[]} Preset names in documentation order.
 */
export function listPresets(): PresetName[] {
  return [...PRESET_NAMES];
}

/**
 * Check whether a string names a preset.
 *
 * @param {string} value - Candidate preset name.
 *
 * @returns {boolean} `true` when the value is a known preset.
 */
export function isPresetName(value: string): value is PresetName {
  return (PRESET_NAMES as readonly string[]).includes(value);
}

/**
 * Read the stored options of a preset without applying defaults.
 *
 * @param {PresetName} name - Preset to read.
 *
 * @returns {Readonly<Partial<CleanerOptions>>} The preset's own option values.
 *
 * @throws {Error} When the preset name is unknown.
 */
export function getPresetValues(name: PresetName): Readonly<Partial<CleanerOptions>> {
  if (!isPresetName(name)) {
    throw new Error(`Unknown preset "${name}". Available presets: ${PRESET_NAMES.join(', ')}`);
  }

  return PRESETS[name];
}

/**
 * Resolve a preset into a complete option set.
 *
 * The returned object is a fresh copy, so mutating it never changes the
 * stored preset definition.
 *
 * @param {PresetName} name - Preset to resolve.
 *
 * @returns {CleanerOptions} Complete options for the preset.
 *
 * @throws {Error} When the preset name is unknown.
 */
export function getPreset(name: PresetName): CleanerOptions {
  return { ...createDefaultOptions(), ...getPresetValues(name) };
}
