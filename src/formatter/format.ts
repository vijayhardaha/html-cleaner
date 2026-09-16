/**
 * ========================================================================
 * HTML formatter
 * ========================================================================
 * Purpose: Lays out parsed HTML deterministically without reparsing it.
 *          Block structure gets newlines and indentation; inline content is
 *          left exactly as authored so no destructive spaces appear.
 * ========================================================================
 */

import type { Element, Root, RootContent } from 'hast';

import { ELEMENT_TEXT_RULES } from '../core/text-rules';
import type { ContentContainer } from '../core/tree';
import { isElement } from '../core/tree';
import type { FormatOptions } from '../core/types';

/** Elements whose inner whitespace is significant and must stay untouched. */
const PRESERVED_WHITESPACE_TAGS: ReadonlySet<string> = new Set(['pre', 'script', 'style', 'textarea']);

/**
 * Check whether an element is block-level for layout purposes.
 *
 * @param {Element} element - Element to test.
 *
 * @returns {boolean} `true` when the element is block-level.
 */
function isBlockElement(element: Element): boolean {
  return ELEMENT_TEXT_RULES.has(element.tagName.toLowerCase());
}

/**
 * Create a text node holding layout whitespace.
 *
 * @param {string} value - Whitespace to insert.
 *
 * @returns {RootContent} Text node.
 */
function layoutText(value: string): RootContent {
  return { type: 'text', value };
}

/**
 * Lay out one container's children when they contain block-level elements.
 *
 * Containers without block children are left untouched, which preserves
 * inline spacing inside paragraphs, headings, and links.
 *
 * @param {ContentContainer} container - Container to lay out.
 * @param {number} childDepth - Indentation level applied to child nodes.
 * @param {boolean} isRoot - Whether the container is the document root.
 * @param {string} newline - Line ending to write.
 * @param {string} indentUnit - One indentation step.
 */
function layoutContainer(
  container: ContentContainer,
  childDepth: number,
  isRoot: boolean,
  newline: string,
  indentUnit: string
): void {
  const hasBlockChild = container.children.some((child) => isElement(child) && isBlockElement(child));

  if (!hasBlockChild) {
    return;
  }

  const kept = container.children.filter((child) => !(child.type === 'text' && child.value.trim() === ''));
  const next: RootContent[] = [];
  const childIndent = newline + indentUnit.repeat(childDepth);

  /** Whether the previous kept child ended a block, so inline content needs a separating newline. */
  let afterBlock = false;

  for (const child of kept) {
    if (isElement(child) && !PRESERVED_WHITESPACE_TAGS.has(child.tagName.toLowerCase())) {
      layoutContainer(child, childDepth + 1, false, newline, indentUnit);

      next.push(layoutText(childIndent), child);
      afterBlock = true;

      continue;
    }

    if (child.type === 'text') {
      // The formatter owns separators inside a laid-out container: replace
      // leading line breaks with the single separating newline, and drop
      // trailing line breaks for the same reason. Without the trailing half, a
      // second pass re-parses "text\n<div>" as a text node that already ends a
      // line and stacks another newline on top of it.
      const textValue = child.value
        .replace(/^[ \t]*(?:\r\n|\r|\n)+[ \t\r\n]*/, '')
        .replace(/[ \t]*(?:\r\n|\r|\n)+[ \t]*$/, '');

      next.push(layoutText((afterBlock ? childIndent : '') + textValue));
      afterBlock = false;

      continue;
    }

    next.push(layoutText(childIndent), child);
    afterBlock = false;
  }

  if (isRoot) {
    const first = next[0];

    if (first !== undefined && first.type === 'text' && first.value.startsWith(newline)) {
      next.shift();
    }
  } else {
    next.push(layoutText(newline + indentUnit.repeat(Math.max(childDepth - 1, 0))));
  }

  container.children = next;
}

/**
 * Format a parsed tree in place.
 *
 * @param {Root} root - Parsed tree to format.
 * @param {FormatOptions} options - Indentation and newline settings.
 */
export function formatHtml(root: Root, options: FormatOptions): void {
  const newline = options.newline === 'crlf' ? '\r\n' : '\n';
  const indentUnit = options.indent === 'tab' ? '\t' : ' '.repeat(Math.max(0, options.indent));

  layoutContainer(root, 0, true, newline, indentUnit);
}
