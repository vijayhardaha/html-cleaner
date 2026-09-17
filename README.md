# @vijayhardaha/html-cleaner

[![CI](https://github.com/vijayhardaha/html-cleaner/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/vijayhardaha/html-cleaner/actions/workflows/ci.yml?query=branch%3Amaster)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

**Turn messy HTML into clean, predictable markup — from the command line or from code.**

HTML pasted out of Google Docs, Word, a CMS, or a web scraper arrives buried in presentation noise:
inline styles, meaningless classes and ids, nested `<span>` wrappers, `&nbsp;` runs, empty elements,
and comments nobody asked for. This tool parses that HTML into a tree, applies a pipeline of small
composable transforms, and serializes the result once — so the same input and options always produce
byte-identical output.

```html
<!-- before -->
<div class="c1 c2" id="docs-internal-guid-9f3" style="line-height:1.38">
  <p dir="ltr" style="margin-top:0">
    <span style="font-size:11pt"><b>Title</b></span
    ><span>&nbsp;&nbsp;</span>
  </p>
  <p>
    <span style="font-size:11pt"><i>Subtitle</i></span>
  </p>
  <p>&nbsp;</p>
  <!-- comment -->
</div>
```

```html
<!-- after: html-cleaner --preset article -->
<div>
  <p dir="ltr"><strong>Title</strong></p>
  <p><em>Subtitle</em></p>
</div>
```

286 characters down to 83: styles, classes, ids, and the empty paragraph are gone, `<b>` became
`<strong>`, and the `&nbsp;&nbsp;` run collapsed into a single regular space — which is why one
space survives before `</p>`. Collapsing normalizes whitespace rather than silently deleting content.

> **This is not a security sanitizer.** It normalizes markup; it does not guarantee that dangerous
> content (`<script>`, event handlers, `javascript:` URLs) is removed from untrusted input. Use a
> dedicated sanitizer such as [DOMPurify](https://github.com/cure53/DOMPurify) for that.

## Table of contents

- [Why this exists](#why-this-exists)
- [Use cases](#use-cases)
- [Install](#install)
- [Quick start](#quick-start)
- [Presets](#presets)
- [Options](#options)
- [Configuration file](#configuration-file)
- [Exit codes](#exit-codes)
- [Statistics](#statistics)
- [Library usage](#library-usage)
- [Documentation](#documentation)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Why this exists

The usual way to clean HTML is a pile of regular expressions. That approach breaks the moment markup
is nested, because regex has no concept of structure — it cannot tell a `class` attribute from the
word "class" inside a paragraph, and it cannot reliably match a closing tag to its opener.

`html-cleaner` works on the parsed tree instead, so it understands structure. It also counts what it
changed, so you can see exactly what happened to a document rather than hoping.

Design commitments:

- **Parse once, transform in memory, serialize once.** No repeated parsing between steps.
- **Deterministic output.** The same input and options always produce the same bytes, which makes
  the tool safe in build steps and pre-commit hooks.
- **Composable transforms.** Each cleaning step is an independent, separately tested unit.
- **Content-preserving by default.** Unwrapping `<span>` or `<a>` keeps its contents; destructive
  operations such as removing images or stripping tags are opt-in.

## Use cases

**Cleaning content pasted from an editor.** Google Docs and Word exports carry a thick layer of
`style`, `class`, and `id` markup. `--preset article` strips it and leaves publishable body copy.

**A pre-commit or CI gate.** `--check` exits `4` when a file would change, so a pipeline can fail
without parsing output:

```bash
html-cleaner --check --preset clean src/**/*.html
```

**Normalizing scraped pages before storing or diffing them.** Deterministic output means two runs
over the same content produce identical bytes, so diffs show real changes rather than formatting
churn.

**Reducing a page to readable text.** `--preset text` drops all markup and keeps line breaks at block
boundaries — useful for search indexing, summarisation, or feeding prose into another tool.

**Preparing HTML for email templates.** Inline styles and editor cruft have to go, but structure and
links must survive.

**Flattening tables into content.** `--remove-tables` keeps cell text and drops the structure;
`--tables-to-div` keeps the hierarchy and renames table elements to `div`s.

## Install

```bash
# Global CLI
npm install -g @vijayhardaha/html-cleaner

# Or as a project dependency
npm install --save-dev @vijayhardaha/html-cleaner

# Or run it without installing
npx @vijayhardaha/html-cleaner --help
```

With Bun:

```bash
bun add -g @vijayhardaha/html-cleaner
bunx @vijayhardaha/html-cleaner --help
```

### Requirements

- **Node.js 20 or newer** (the package declares `engines.node >= 20.0.0`)
- Bun is fully supported — the CLI and library both run under it
- No runtime dependencies: every dependency is bundled into the published build. The only installed
  package is `@types/hast`, which is types-only and contributes no runtime code

## Quick start

```bash
# Clean a file and print the result
html-cleaner input.html

# Pipe in, pipe out
cat input.html | html-cleaner > clean.html

# Clean a file in place
html-cleaner --write input.html

# Write somewhere else
html-cleaner input.html --output clean.html

# Use a preset, and see what changed
html-cleaner --preset clean --report input.html

# Reduce a document to readable plain text
html-cleaner --preset text article.html
```

If you pass no input file, stdin is read. If you pass no `--output` and no `--write`, stdout is
written.

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

See [docs/presets.md](./docs/presets.md) for the exact option values behind each preset.

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

`--write` cannot be combined with `--output`, `--stdin`, or `--stdout`, and it requires an input
file. `--output` refuses to overwrite the input file — use `--write` when you mean it.

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

[docs/options.md](./docs/options.md) documents every flag with real before/after output.

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

Every other option defaults to `false`. Nothing destructive happens unless you ask for it — images,
links, tables, and attributes are all kept by default.

## Configuration file

For repeatable runs, keep options in a JSON file. Keys are the camelCase option names from the tables
above.

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

Config files are validated when read, and errors name the offending file. See
[docs/configuration.md](./docs/configuration.md) for the full key reference and validation rules.

## Exit codes

| Code | Meaning                                              |
| ---- | ---------------------------------------------------- |
| `0`  | Success                                              |
| `1`  | Input, output, or configuration error                |
| `2`  | Invalid usage                                        |
| `4`  | `--check` found that cleaning would change the input |

This makes `--check` usable directly as a gate — `0` means "already clean", `4` means "would change":

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

The same counters are returned by the library as `stats`.

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

Exported types: `CleanerOptions`, `CleanResult`, `TransformStats`, `TransformContext`,
`HtmlTransform`, `AttributeOptions`, `FormatOptions`.

Presets are currently a CLI convenience; in the library, set the equivalent options directly. See
[docs/library-api.md](./docs/library-api.md) for the full reference and how to write a custom
transform.

## Documentation

| Guide                                            | Contents                                                      |
| ------------------------------------------------ | ------------------------------------------------------------- |
| [docs/usage.md](./docs/usage.md)                 | Recipes: pipes, CI gates, editor paste, text extraction       |
| [docs/options.md](./docs/options.md)             | Every flag with real before/after output, and exact semantics |
| [docs/presets.md](./docs/presets.md)             | What each preset enables, as a full matrix                    |
| [docs/configuration.md](./docs/configuration.md) | Config file schema, validation, and precedence                |
| [docs/library-api.md](./docs/library-api.md)     | Library API reference and custom transforms                   |
| [CHANGELOG.md](./CHANGELOG.md)                   | Release history                                               |
| [AGENTS.md](./AGENTS.md)                         | Conventions for AI coding agents working in this repo         |

## Development

```bash
bun install           # install dependencies
bun run build         # build the library (ESM + CJS + types) and the CLI bundle
bun run test          # run the test suite
bun run test:coverage # run with a 100% coverage gate
bun run bench         # benchmark cleaning on the 10kb/100kb/1mb fixtures
bun run typecheck     # typecheck without emitting
bun run lint          # lint
bun run format        # format with Prettier
```

Benchmarks run under Bun and print mean time per operation plus throughput, both end-to-end and
broken down by pipeline stage:

```
benchmark                  ms/op   ops/sec
-------------------------  ------  -------
10kb --preset clean        1.93    519
100kb --preset clean       18.29   55
1mb --preset clean         729.30  1
```

The build is Vite-only (no esbuild). Two configs:

- `vite.config.ts` — builds `src/index.ts` to `dist/index.js` (ESM) and `dist/index.cjs` (CJS), and
  emits declarations to `types/` via `vite-plugin-dts`.
- `vitebin.config.ts` — builds `src/cli/index.ts` to `dist/cli/index.cjs`, injects the shebang, and
  sets the executable bit.

Dependencies are bundled into the output, so the published package installs nothing at runtime beyond
`@types/hast` for TypeScript consumers.

The test suite enforces **100% statement, branch, function, and line coverage**, and asserts that
cleaning is idempotent (`clean(clean(x)) === clean(x)`).

## Contributing

Issues and pull requests are welcome at
[github.com/vijayhardaha/html-cleaner](https://github.com/vijayhardaha/html-cleaner).

Before opening a pull request:

1. `bun run test:coverage` — must stay at 100%
2. `bun run typecheck`
3. `bun run lint:check`
4. `bun run format:check`

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and are checked by
commitlint. See [AGENTS.md](./AGENTS.md) for the project's conventions in detail.

## License

[MIT](./LICENSE) © Vijay Hardaha
