# Library API

The same engine behind the CLI, usable directly. Ships as ESM and CommonJS with TypeScript types.

```js
import { cleanHtml } from "@vijayhardaha/html-cleaner";
```

```js
const { cleanHtml } = require("@vijayhardaha/html-cleaner");
```

## `cleanHtml(input, overrides?)`

Cleans an HTML string. HTML is parsed once, transformed in memory, formatted when enabled, and
serialized once.

```ts
function cleanHtml(input: string, overrides?: Partial<CleanerOptions>): CleanResult;
```

```js
const { html, stats } = cleanHtml('<div   style="color:red"><p>Hello&nbsp;world</p></div>', {
  removeStyles: true,
  collapseNbsp: true
});

// html  -> '<div>\n  <p>Hello world</p>\n</div>\n'
// stats -> { removedStyles: 1, normalizedNbspNodes: 1, ... }
```

This normalizes markup. It is **not** a security sanitizer.

## `resolveOptions(overrides?)`

Merges partial options over the defaults and returns a complete, mutable option set.

```ts
function resolveOptions(overrides?: Partial<CleanerOptions>): CleanerOptions;
```

```js
const options = resolveOptions({ removeClasses: true });

options.format; // true — inherited from the defaults
```

## `buildTransforms(options)`

Returns the transforms that the resolved options enable, in execution order. Useful for inspecting
or composing a pipeline.

```ts
function buildTransforms(options: CleanerOptions): HtmlTransform[];
```

```js
const transforms = buildTransforms(resolveOptions({ removeClasses: true }));

transforms.map((t) => t.name);
// ['comments', 'nbsp', 'semantic-bold', 'semantic-italic', 'classes', 'empty']
```

Note that the defaults contribute transforms of their own — `comments`, `nbsp`,
`semantic-bold`, `semantic-italic`, and `empty` all come from default option values, not from your
overrides. Transforms run in the order returned.

Each transform is `{ name, apply(root, context) }` and mutates the tree in place.

## `createDefaultOptions()`

Returns a fresh, mutable copy of the defaults. Use this instead of mutating `DEFAULT_OPTIONS`.

```ts
function createDefaultOptions(): CleanerOptions;
```

## `DEFAULT_OPTIONS`

The frozen shared defaults. Treat as read-only — mutating it will throw in strict mode and corrupt
subsequent runs otherwise.

```ts
const DEFAULT_OPTIONS: Readonly<CleanerOptions>;
```

## Types

| Type               | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `CleanerOptions`   | Full option set for a run                                    |
| `CleanResult`      | `{ html: string; stats: TransformStats }`                    |
| `TransformStats`   | Per-run counters                                             |
| `TransformContext` | `{ options, stats }` handed to every transform               |
| `HtmlTransform`    | `{ name, apply(root, context) }`                             |
| `AttributeOptions` | `removeAttributes`, `keepAttributes`, `removeAttributeNames` |
| `FormatOptions`    | `format`, `indent`, `newline`, `finalNewline`                |

### `TransformStats`

Every counter is a number, and all of them are always present:

```ts
interface TransformStats {
  removedComments: number;
  removedAttributes: number;
  removedStyles: number;
  removedClasses: number;
  removedIds: number;
  removedEmptyNodes: number;
  removedImages: number;
  unwrappedLinks: number;
  unwrappedSpans: number;
  convertedBold: number;
  convertedItalic: number;
  removedTableElements: number;
  convertedTableElements: number;
  normalizedNbspNodes: number;
}
```

## Custom transforms

An `HtmlTransform` receives the parsed tree and the run context. Mutate in place and increment the
counters you affect:

```ts
import type { HtmlTransform } from "@vijayhardaha/html-cleaner";

const dropDataAttributes: HtmlTransform = {
  name: "drop-data-attributes",
  apply(root, context) {
    // walk `root` and mutate it
    context.stats.removedAttributes += 1;
  }
};
```

Custom transforms are not accepted by `cleanHtml()` directly. To use one, parse, transform, and
serialize yourself, or run it over the tree before calling the cleaner.

## Presets

Presets are currently CLI-only. In the library, pass the equivalent options — see
[presets.md](./presets.md) for the exact values.
