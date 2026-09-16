/**
 * ========================================================================
 * html-cleaner-cli - library entry point
 * ========================================================================
 * Purpose: Public surface of the html-cleaner library. Only the cleaner
 *          engine and its stable types are exported; internal transforms stay
 *          private so consumers depend on a deliberate API.
 * ========================================================================
 */

export { cleanHtml, resolveOptions, buildTransforms } from './core/cleaner';
export { createDefaultOptions, DEFAULT_OPTIONS } from './core/types';
export type {
  AttributeOptions,
  CleanerOptions,
  CleanResult,
  FormatOptions,
  HtmlTransform,
  TransformContext,
  TransformStats,
} from './core/types';
