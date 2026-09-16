/**
 * ========================================================================
 * Tag stripping
 * ========================================================================
 * Purpose: Reduces a document to its textual content, optionally keeping
 *          block boundaries readable.
 * ========================================================================
 */

import type { ElementContent, RootContent } from 'hast';

import { ELEMENT_TEXT_RULES, SKIPPED_TEXT_TAGS } from '../core/text-rules';
import type { HtmlTransform } from '../core/types';
import { isVoidElement } from '../core/void-elements';

/**
 * Convert one node to its textual content.
 *
 * @param {RootContent} node - Node to convert.
 * @param {boolean} preserveBreaks - Whether block boundaries become newlines.
 *
 * @returns {string} Text contributed by the node.
 */
function nodeText(node: RootContent, preserveBreaks: boolean): string {
  if (node.type === 'text') {
    return node.value;
  }

  if (node.type !== 'element') {
    return '';
  }

  const tagName = node.tagName.toLowerCase();

  if (SKIPPED_TEXT_TAGS.has(tagName)) {
    return '';
  }

  const inner = node.children.map((child: ElementContent) => nodeText(child, preserveBreaks)).join('');

  if (!preserveBreaks) {
    return inner;
  }

  if (tagName === 'br') {
    return '\n';
  }

  if (ELEMENT_TEXT_RULES.has(tagName)) {
    return inner.length > 0 ? `\n${inner}\n` : '';
  }

  return inner;
}

/**
 * Collapse whitespace around line breaks, keep one break per boundary, and
 * trim blank edge lines.
 *
 * @param {string} text - Text produced by the traversal.
 *
 * @returns {string} Normalized text content.
 */
function normalizeBreaks(text: string): string {
  return text
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '');
}

/**
 * Strip every element, keeping textual content.
 *
 * `<script>`, `<style>`, `<template>`, `<noscript>`, and `<head>` content is
 * dropped rather than surfaced as text, because it is not visible content.
 * Void elements contribute nothing on their own; with `preserveBreaks`,
 * `<br>` contributes one line break.
 *
 * @param {boolean} preserveBreaks - Whether block boundaries and `<br>` produce line breaks.
 *
 * @returns {HtmlTransform} Transform that replaces the tree with text.
 */
export function stripAllTags(preserveBreaks: boolean): HtmlTransform {
  return {
    name: 'strip-tags',
    apply(root) {
      const text = root.children.map((child) => nodeText(child, preserveBreaks)).join('');
      const value = preserveBreaks ? normalizeBreaks(text) : text;

      root.children = value.length > 0 ? [{ type: 'text', value }] : [];
    },
  };
}

/** Void elements are handled by their own rules during stripping. */
export { isVoidElement };
