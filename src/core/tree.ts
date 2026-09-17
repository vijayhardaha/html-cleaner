/**
 * ========================================================================
 * Tree helpers
 * ========================================================================
 * Purpose: Small, shared AST utilities used by the transforms. Nothing here
 *          interprets HTML text: every helper walks parsed nodes only.
 * ========================================================================
 */

import type { Comment, Element, RootContent, Text } from 'hast';
import { find, html } from 'property-information';

/** Result of mapping a node: keep it, replace it, expand it, or drop it. */
export type NodeMapping = RootContent | RootContent[] | null;

/**
 * Any node that owns a `children` array.
 *
 * @property {RootContent[]} children - Content nodes owned by the parent.
 */
export interface ContentContainer {
  children: RootContent[];
}

/**
 * Narrow a node to an element node.
 *
 * @param {RootContent | undefined} node - Node to inspect.
 *
 * @returns {boolean} `true` when the node is an element.
 */
export function isElement(node: RootContent | undefined): node is Element {
  return node?.type === 'element';
}

/**
 * Narrow a node to a text node.
 *
 * @param {RootContent} node - Node to inspect.
 *
 * @returns {boolean} `true` when the node is text.
 */
export function isText(node: RootContent): node is Text {
  return node.type === 'text';
}

/**
 * Narrow a node to a comment node.
 *
 * @param {RootContent} node - Node to inspect.
 *
 * @returns {boolean} `true` when the node is a comment.
 */
export function isComment(node: RootContent): node is Comment {
  return node.type === 'comment';
}

/**
 * Walk a container depth-first and replace every child with whatever the
 * mapper returns.
 *
 * The mapper contract is: return the node itself to keep it, `null` to drop
 * it, or one or more other nodes to splice in its place. Replacement nodes are
 * mapped again, so nested unwrapping settles in a single pass without
 * reparsing.
 *
 * @param {ContentContainer} container - Node whose children are mapped.
 * @param {(node: RootContent) => NodeMapping} map - Mapper applied to each child.
 */
export function visitContent(container: ContentContainer, map: (node: RootContent) => NodeMapping): void {
  const next: RootContent[] = [];

  for (const child of container.children) {
    next.push(...resolveNode(child, map));
  }

  container.children = next;
}

/**
 * Resolve one node through the mapper, walking into what it becomes.
 *
 * @param {RootContent} node - Node to map.
 * @param {(node: RootContent) => NodeMapping} map - Mapper applied to the node.
 *
 * @returns {RootContent[]} Nodes that replace the original in its parent.
 */
function resolveNode(node: RootContent, map: (node: RootContent) => NodeMapping): RootContent[] {
  const mapped = map(node);

  if (mapped === null) {
    return [];
  }

  if (mapped === node) {
    if (isElement(node)) {
      visitContent(node, map);
    }

    return [node];
  }

  const replacements = Array.isArray(mapped) ? mapped : [mapped];
  const next: RootContent[] = [];

  for (const replacement of replacements) {
    if (isElement(replacement)) {
      next.push(...resolveNode(replacement, map));
    } else {
      next.push(replacement);
    }
  }

  return next;
}

/**
 * Resolve the HTML attribute name behind a HAST property key.
 *
 * HAST stores attributes under their property names (`className`), while users
 * write attribute names (`class`). Unknown attributes resolve to themselves.
 *
 * @param {string} propertyKey - Key as stored on `element.properties`.
 *
 * @returns {string} The matching HTML attribute name.
 */
export function attributeName(propertyKey: string): string {
  return find(html, propertyKey).attribute;
}

/**
 * Delete one property from an element.
 *
 * @param {Element} element - Element to mutate.
 * @param {string} propertyKey - Property key to delete.
 *
 * @returns {boolean} `true` when the property existed and was removed.
 */
export function removeProperty(element: Element, propertyKey: string): boolean {
  if (!Object.hasOwn(element.properties, propertyKey)) {
    return false;
  }

  delete element.properties[propertyKey];

  return true;
}
