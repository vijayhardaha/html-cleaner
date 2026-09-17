# @vijayhardaha/html-cleaner

A command-line tool and library that takes messy HTML — the kind pasted out of Google Docs, Word, a CMS, or a web scraper — and turns it into clean, predictable, deterministic markup.

It parses HTML into an AST, applies a pipeline of small composable transforms, and serializes the result once. Every run of the same input with the same options produces byte-identical output, which makes it safe to use in build steps and pre-commit hooks.

> **Not a security sanitizer.** This tool normalizes markup. It does not guarantee that dangerous content (`<script>`, event handlers, `javascript:` URLs) is removed for untrusted input. Use a dedicated sanitizer such as DOMPurify for that job.

## Why

HTML that arrives from editors and scrapers is full of noise: inline `style` attributes, meaningless `class` and `id` values, nested `<span>` wrappers, `&nbsp;` runs, empty elements, `<b>` instead of `<strong>`, and comments nobody asked for. Cleaning that by hand with regular expressions is unreliable, because regex has no concept of nesting.

`html-cleaner` works on the parsed tree instead, so it understands structure. It also tracks **what** it changed, so you can see exactly what happened to a document.

## Install

```bash
npm install -g @vijayhardaha/html-cleaner
```

Or run it without installing:

```bash
npx @vijayhardaha/html-cleaner --help
```

Requires **Node.js 20 or newer**.

## Quick start

Clean a file and print the result:

```bash
html-cleaner input.html
```

Read from stdin and write to stdout (great for pipes):

```bash
cat input.html | html-cleaner > clean.html
```

Clean a file in place:

```bash
html-cleaner --write input.html
```

Write to a different file:

```bash
html-cleaner input.html --output clean.html
```

Clean with a preset and see what changed:

```bash
html-cleaner --preset clean --report input.html
```

Reduce a document to readable plain text:

```bash
html-cleaner --preset text article.html
```

## Presets

Presets are named bundles of options. Start with one, then override individual flags.

| Preset       | Intent                                   | What it enables beyond the defaults                                               |
| ------------ | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `safe`       | Minimal, low-risk cleanup                | nothing extra — the defaults only                                                 |
| `clean`      | Strip presentation noise from a document | remove styles, classes, ids, and NBSP-only nodes                                  |
| `article`    | Prepare body copy for publishing         | `clean`, plus unwrap spans and links, remove images                               |
| `aggressive` | Reduce markup to structure and content   | remove **all** attributes, unwrap spans and links, remove images and table markup |
| `text`       | Extract readable text, no markup at all  | strip every tag, keep line breaks, disable formatting                             |

```bash
html-cleaner --preset article input.html
html-cleaner --preset clean --remove-spans input.html   # preset plus a flag
```

## Options

Options are applied in this order, later sources winning:

```
built-in defaults  ->  --preset  ->  --config file  ->  individual CLI flags
```

### Input and output

| Flag                  | Description                                   |
| --------------------- | --------------------------------------------- |
| `-o, --output <file>` | Write the cleaned HTML to a file              |
| `-w, --write`         | Modify the input file in place                |
| `--stdin`             | Read HTML from stdin explicitly               |
| `--stdout`            | Write cleaned HTML to stdout explicitly       |
| `--check`             | Exit `4` when cleaning would change the input |
| `--report`            | Print cleanup statistics to stderr            |

`--write` cannot be combined with `--output`, `--stdin`, or `--stdout`, and it requires an input file. `--output` refuses to overwrite the input file — use `--write` when you mean it.

### Cleaning

| Flag                   | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| `--remove-comments`    | Remove HTML comments                                           |
| `--remove-styles`      | Remove `style` attributes                                      |
| `--remove-classes`     | Remove `class` attributes                                      |
| `--remove-ids`         | Remove `id` attributes                                         |
| `--remove-attributes`  | Remove all attributes except those kept by `--keep-attr`       |
| `--keep-attr <name>`   | Attribute name preserved by `--remove-attributes` (repeatable) |
| `--remove-attr <name>` | Attribute name removed explicitly (repeatable)                 |
| `--collapse-nbsp`      | Collapse non-breaking spaces into regular spaces               |
| `--remove-empty-nbsp`  | Treat whitespace/NBSP-only nodes as empty                      |
| `--convert-bold`       | Convert `<b>` to `<strong>`                                    |
| `--convert-italic`     | Convert `<i>` to `<em>`                                        |
| `--remove-empty`       | Remove non-void elements without content                       |
| `--remove-spans`       | Unwrap `<span>` elements                                       |
| `--remove-links`       | Unwrap `<a>` elements                                          |
| `--remove-images`      | Remove `<img>` elements                                        |
| `--remove-tables`      | Remove table structure and keep content                        |
| `--tables-to-div`      | Convert table elements to nested `div`s                        |
| `--strip-tags`         | Strip all element markup and keep text                         |
| `--preserve-breaks`    | Keep readable line breaks when stripping tags                  |

`--remove-tables` and `--tables-to-div` are mutually exclusive; when both are given, removal wins.

### Formatting

| Flag                     | Description                              |
| ------------------------ | ---------------------------------------- |
| `--format`               | Format output deterministically          |
| `--indent <number\|tab>` | Indentation: a number of spaces or `tab` |
| `--newline <lf\|crlf>`   | Line ending: `lf` or `crlf`              |
| `--no-final-newline`     | Do not append a trailing newline         |

### Defaults

A run with no options already does this:

| Option           | Default |
| ---------------- | ------- |
| `collapseNbsp`   | `true`  |
| `convertBold`    | `true`  |
| `convertItalic`  | `true`  |
| `removeEmpty`    | `true`  |
| `removeComments` | `true`  |
| `format`         | `true`  |
| `indent`         | `2`     |
| `newline`        | `lf`    |
| `finalNewline`   | `true`  |

Every other option defaults to `false`.

## Configuration file

For repeatable runs, keep options in a JSON file. Keys are the camelCase option names from the tables above.

```json
{
  "removeComments": true,
  "removeStyles": true,
  "removeClasses": true,
  "removeEmpty": true,
  "format": true,
  "indent": 2
}
```

```bash
html-cleaner --config cleaner.json input.html
```

## Exit codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| `0`  | Success                                              |
| `1`  | Input, output, or configuration error                |
| `2`  | Invalid usage                                        |
| `4`  | `--check` found that cleaning would change the input |

This makes `--check` usable as a CI or pre-commit gate:

```bash
html-cleaner --check src/**/*.html || echo "HTML needs cleaning"
```

## Statistics

`--report` writes a summary to **stderr** so it never contaminates piped output:

```bash
printf '%s' '<!-- draft --><!-- todo --><div style="color:red" class="x" id="y">
  <p><b>b</b> and <i>i</i></p><span>sp</span><p></p><p>&nbsp;</p></div>' \
  | html-cleaner --preset clean --report
```

```
html-cleaner report
  comments removed: 2
  attributes removed: 0
  styles removed: 1
  classes removed: 1
  ids removed: 1
  empty elements removed: 2
  images removed: 0
  links unwrapped: 0
  spans unwrapped: 0
  bold conversions: 1
  italic conversions: 1
  table elements removed: 0
  table elements converted: 0
  nbsp nodes normalized: 1
```

```html
<div>
  <p><strong>b</strong> and <em>i</em></p>
  <span>sp</span>
</div>
```

## Library usage

The same engine is available as a library, in both ESM and CommonJS, with TypeScript types included.

```js
import { cleanHtml } from "@vijayhardaha/html-cleaner";

const { html, stats } = cleanHtml('<div   style="color:red"><p>Hello&nbsp;world</p></div>', {
  removeStyles: true,
  collapseNbsp: true
});

console.log(html);
// <div>
//   <p>Hello world</p>
// </div>

console.log(stats.removedStyles); // 1
```

CommonJS works too:

```js
const { cleanHtml } = require("@vijayhardaha/html-cleaner");
```

The public API is deliberately small:

| Export                         | Description                                       |
| ------------------------------ | ------------------------------------------------- |
| `cleanHtml(input, overrides?)` | Clean a string, returning `{ html, stats }`       |
| `resolveOptions(overrides?)`   | Merge partial options over the defaults           |
| `buildTransforms(options)`     | Build the transform pipeline for resolved options |
| `createDefaultOptions()`       | A fresh, mutable copy of the defaults             |
| `DEFAULT_OPTIONS`              | The frozen shared defaults                        |

Exported types: `CleanerOptions`, `CleanResult`, `TransformStats`, `TransformContext`, `HtmlTransform`, `AttributeOptions`, `FormatOptions`.

Presets are currently a CLI convenience; in the library, set the equivalent options directly (see the preset table above).

## Development

```bash
bun install          # install dependencies
bun run build        # build the library (ESM + CJS + types) and the CLI bundle
bun run test         # run the test suite
bun run test:coverage# run with a 100% coverage gate
bun run typecheck    # typecheck without emitting
bun run lint         # lint
bun run format       # format with Prettier
```

The build is Vite-only (no esbuild). Two configs:

- `vite.config.ts` — builds `src/index.ts` to `dist/index.js` (ESM) and `dist/index.cjs` (CJS), and emits declarations to `types/` via `vite-plugin-dts`.
- `vitebin.config.ts` — builds `src/cli/index.ts` to `dist/cli/index.cjs`, injects the shebang, and sets the executable bit.

Dependencies are bundled into the output, so the published package installs nothing at runtime beyond `@types/hast` for TypeScript consumers.

## License

[MIT](./LICENSE) © Vijay Hardaha
