# html-cleaner-cli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `html-cleaner-cli`, a TypeScript-based Node.js/Bun-compatible command-line HTML cleanup tool that parses HTML into an AST, applies composable transformations, and serializes predictable cleaned HTML.

**Architecture:** The project has a library-first core and a thin CLI. HTML is parsed once into HAST using `unified`/`rehype-parse`, transformed through ordered independent plugins, normalized/formatted once, and serialized with `rehype-stringify`. Configuration is resolved as defaults → preset → config file → CLI overrides, while every transformation is independently testable.

**Tech Stack:** TypeScript, Node.js 20+, Bun compatibility, pnpm, unified, rehype-parse, rehype-stringify, HAST, commander, Vitest, tsup, ESLint, Prettier.

**Spec:** The agreed product design is the source specification for this plan: `html-cleaner-cli` supports attribute/style/class/ID removal, tag stripping, NBSP cleanup, semantic `<b>`/`i>` conversion, empty-tag removal, span/image/link/table handling, comment removal, formatting, presets, config files, stdin/stdout, file output, in-place writes, and a library API.

## Global Constraints

- Package/project name: `html-cleaner-cli`.
- CLI executable: `html-cleaner`.
- Runtime support: Node.js 20+.
- Bun must be supported where APIs are compatible.
- Language: TypeScript with strict type checking enabled.
- Parse HTML once, transform the AST in memory, serialize once.
- Do not use regex as the primary HTML transformation mechanism.
- Cleaning and security sanitization are separate concerns. Do not claim the normal cleaner is an XSS sanitizer.
- Preserve content when unwrapping elements such as `span` and links unless the option explicitly means removal.
- `--remove-links` unwraps anchors and keeps their content.
- `--remove-images` removes image elements and their contents.
- `--remove-empty` never removes void elements such as `img`, `br`, `hr`, `input`, `meta`, and `link`.
- `--remove-empty-nbsp` treats HTML `&nbsp;` and Unicode U+00A0-only content as empty.
- `--remove-tables` removes table structure while preserving descendant content.
- `--tables-to-div` preserves table structure approximately using nested `div` elements and is a separate feature from `--remove-tables`.
- CLI arguments override configuration-file values.
- The core library must be usable without invoking the CLI.
- Transformations must be independently testable and composable.
- Do not add unrelated features during implementation.
- Every task must finish with focused tests and a commit.
- No `TODO`, `TBD`, placeholder implementation, or silently swallowed errors.

---

## Target Repository Layout

```text
html-cleaner-cli/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── args.ts
│   │   └── help.ts
│   ├── core/
│   │   ├── cleaner.ts
│   │   ├── pipeline.ts
│   │   ├── context.ts
│   │   └── types.ts
│   ├── parser/
│   │   ├── parse.ts
│   │   └── stringify.ts
│   ├── transforms/
│   │   ├── attributes.ts
│   │   ├── styles.ts
│   │   ├── classes.ts
│   │   ├── ids.ts
│   │   ├── comments.ts
│   │   ├── empty.ts
│   │   ├── nbsp.ts
│   │   ├── semantic.ts
│   │   ├── spans.ts
│   │   ├── images.ts
│   │   ├── links.ts
│   │   ├── tables.ts
│   │   └── strip-tags.ts
│   ├── formatter/
│   │   └── format.ts
│   ├── presets/
│   │   ├── index.ts
│   │   ├── safe.ts
│   │   ├── clean.ts
│   │   ├── article.ts
│   │   ├── aggressive.ts
│   │   └── text.ts
│   ├── config/
│   │   ├── load.ts
│   │   └── merge.ts
│   └── index.ts
├── tests/
│   ├── core/
│   ├── parser/
│   ├── transforms/
│   ├── formatter/
│   ├── presets/
│   ├── config/
│   ├── cli/
│   ├── fixtures/
│   └── integration/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── eslint.config.js
├── prettier.config.mjs
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

# Phase 1: Project Foundation

### Task 1: Scaffold the TypeScript package

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vitest.config.ts`
- Create: `eslint.config.js`
- Create: `prettier.config.mjs`
- Create: `.gitignore`
- Create: `src/index.ts`
- Create: `tests/smoke.test.ts`

**Interfaces:**
- Produces package metadata, strict TypeScript compilation, test runner, bundling, linting, and formatting infrastructure.

- [ ] Step 1: Create `package.json` with package name `html-cleaner-cli`, private during initial development, `"type": "module"`, Node 20 engine constraint, CLI entry mapping `"html-cleaner": "./dist/cli/index.js"`, library exports for `"."`, scripts for `build`, `dev`, `test`, `test:watch`, `lint`, `format`, `format:check`, and `typecheck`.

- [ ] Step 2: Add runtime dependencies for `unified`, `rehype-parse`, `rehype-stringify`, and `commander`.

- [ ] Step 3: Add development dependencies for TypeScript, tsup, Vitest, ESLint, Prettier, relevant TypeScript ESLint packages, and HAST/unified type packages required by the selected versions.

- [ ] Step 4: Create strict `tsconfig.json` with `target` compatible with Node 20, `module`/`moduleResolution` set for modern ESM, `strict: true`, declaration generation enabled, no implicit `any`, and source maps.

- [ ] Step 5: Configure tsup to build both the library entry `src/index.ts` and CLI entry `src/cli/index.ts`, emit ESM output, declarations for the library, and preserve a runnable CLI with a Node shebang.

- [ ] Step 6: Configure Vitest and create `tests/smoke.test.ts` that imports from `src/index.ts` and proves the test environment runs.

- [ ] Step 7: Run:
```bash
pnpm install
pnpm typecheck
pnpm test --run
pnpm build
pnpm lint
```
Expected: all commands exit 0.

- [ ] Step 8: Commit:
```bash
git add .
git commit -m "chore: scaffold html-cleaner-cli"
```

---

# Phase 2: Core Types and AST Pipeline

### Task 2: Define cleaner options and shared types

**Files:**
- Create: `src/core/types.ts`
- Create: `tests/core/types.test.ts`

**Interfaces:**
- Produces `CleanerOptions`, `AttributeOptions`, `FormatOptions`, `TransformContext`, `HtmlTransform`, `CleanResult`, and related public types.
- Later tasks consume these exact types.

- [ ] Step 1: Add tests asserting default-option construction is deterministic and all boolean options are represented.

- [ ] Step 2: Define:

```ts
export interface CleanerOptions {
  removeAttributes: boolean
  keepAttributes: string[]
  removeAttributeNames: string[]
  removeStyles: boolean
  removeClasses: boolean
  removeIds: boolean

  stripTags: boolean
  preserveBreaksWhenStripping: boolean

  collapseNbsp: boolean
  removeEmptyNbsp: boolean

  convertBold: boolean
  convertItalic: boolean

  removeEmpty: boolean
  removeSpans: boolean
  removeImages: boolean
  removeLinks: boolean

  removeTables: boolean
  tablesToDiv: boolean

  removeComments: boolean

  format: boolean
  indent: number | "tab"
  newline: "lf" | "crlf"
  finalNewline: boolean
}
```

- [ ] Step 3: Define:

```ts
export interface TransformContext {
  options: CleanerOptions
  stats: TransformStats
}

export interface TransformStats {
  removedComments: number
  removedAttributes: number
  removedStyles: number
  removedClasses: number
  removedIds: number
  removedEmptyNodes: number
  removedImages: number
  unwrappedLinks: number
  unwrappedSpans: number
  convertedBold: number
  convertedItalic: number
  removedTableElements: number
  convertedTableElements: number
  normalizedNbspNodes: number
}
```

- [ ] Step 4: Define:

```ts
import type { Root } from "hast"

export interface HtmlTransform {
  name: string
  apply(root: Root, context: TransformContext): void
}
```

- [ ] Step 5: Define a result object:

```ts
export interface CleanResult {
  html: string
  stats: TransformStats
}
```

- [ ] Step 6: Add default options factory and freeze/clone semantics so callers cannot mutate global defaults.

- [ ] Step 7: Run the focused test and full typecheck.

- [ ] Step 8: Commit:
```bash
git add src/core/types.ts tests/core/types.test.ts
git commit -m "feat: define cleaner core types"
```

### Task 3: Implement parser and serializer

**Files:**
- Create: `src/parser/parse.ts`
- Create: `src/parser/stringify.ts`
- Create: `tests/parser/parse.test.ts`
- Create: `tests/parser/stringify.test.ts`

**Interfaces:**
- Consumes HTML strings.
- Produces/accepts `Root`.
- Exposes:
```ts
parseHtml(input: string): Root
stringifyHtml(root: Root): string
```

- [ ] Step 1: Write tests for normal HTML, text fragments, comments, nested elements, and malformed HTML that an HTML parser can repair.

- [ ] Step 2: Implement `parseHtml` with `unified().use(rehypeParse, { fragment: true }).parse(input)`.

- [ ] Step 3: Implement `stringifyHtml` using `rehype-stringify`.

- [ ] Step 4: Add tests proving parse/stringify preserves expected semantics.

- [ ] Step 5: Run:
```bash
pnpm vitest run tests/parser
pnpm typecheck
```

- [ ] Step 6: Commit:
```bash
git add src/parser tests/parser
git commit -m "feat: add html parser and serializer"
```

### Task 4: Implement the transform pipeline

**Files:**
- Create: `src/core/pipeline.ts`
- Create: `src/core/context.ts`
- Create: `tests/core/pipeline.test.ts`

**Interfaces:**
- Produces:
```ts
createTransformContext(options: CleanerOptions): TransformContext
runTransforms(root: Root, transforms: HtmlTransform[], context: TransformContext): Root
```

- [ ] Step 1: Write a pipeline test with two fake transforms that mutate the AST and update stats in sequence.

- [ ] Step 2: Implement context construction with zeroed stats.

- [ ] Step 3: Implement sequential transform execution without reparsing or reserializing between transforms.

- [ ] Step 4: Add a deterministic order test.

- [ ] Step 5: Run focused tests.

- [ ] Step 6: Commit:
```bash
git add src/core tests/core/pipeline.test.ts
git commit -m "feat: add html transform pipeline"
```

---

# Phase 3: Core Cleaning Transformations

### Task 5: Implement comment removal

**Files:**
- Create: `src/transforms/comments.ts`
- Create: `tests/transforms/comments.test.ts`

**Interface:**
```ts
removeComments(): HtmlTransform
```

- [ ] Step 1: Add tests for one comment, nested comments between nodes, and multiple comments.

- [ ] Step 2: Remove nodes whose HAST `type` is `comment`.

- [ ] Step 3: Increment `removedComments`.

- [ ] Step 4: Run focused tests.

- [ ] Step 5: Commit:
```bash
git add src/transforms/comments.ts tests/transforms/comments.test.ts
git commit -m "feat: add comment removal transform"
```

### Task 6: Implement attribute, style, class, and ID removal

**Files:**
- Create: `src/transforms/attributes.ts`
- Create: `src/transforms/styles.ts`
- Create: `src/transforms/classes.ts`
- Create: `src/transforms/ids.ts`
- Create: corresponding tests under `tests/transforms/`

**Interfaces:**
```ts
removeAttributes(): HtmlTransform
removeStyles(): HtmlTransform
removeClasses(): HtmlTransform
removeIds(): HtmlTransform
```

- [ ] Step 1: Write tests for ordinary attributes, `style`, `class`, and `id`.
- [ ] Step 2: Test `keepAttributes` behavior for `removeAttributes`.
- [ ] Step 3: Test case-insensitive HTML attribute names.
- [ ] Step 4: Implement generic attribute filtering while preserving attributes listed in `keepAttributes`.
- [ ] Step 5: Implement dedicated style/class/id removal.
- [ ] Step 6: Update corresponding stats counters.
- [ ] Step 7: Run focused tests and typecheck.
- [ ] Step 8: Commit:
```bash
git add src/transforms/{attributes,styles,classes,ids}.ts tests/transforms
git commit -m "feat: add attribute and css cleanup transforms"
```

### Task 7: Implement semantic `<b>` and `<i>` conversion

**Files:**
- Create: `src/transforms/semantic.ts`
- Create: `tests/transforms/semantic.test.ts`

**Interface:**
```ts
convertSemanticTags(options: CleanerOptions): HtmlTransform[]
```

- [ ] Step 1: Test `<b>` → `<strong>`, `<i>` → `<em>`, nested elements, and unaffected tags.
- [ ] Step 2: Implement element-name replacement while retaining child nodes.
- [ ] Step 3: Update semantic transformation stats.
- [ ] Step 4: Run tests.
- [ ] Step 5: Commit:
```bash
git add src/transforms/semantic.ts tests/transforms/semantic.test.ts
git commit -m "feat: add semantic b and i conversion"
```

### Task 8: Implement NBSP normalization

**Files:**
- Create: `src/transforms/nbsp.ts`
- Create: `tests/transforms/nbsp.test.ts`

**Interface:**
```ts
normalizeNbsp(): HtmlTransform
```

- [ ] Step 1: Test repeated `&nbsp;`, actual U+00A0 characters, mixed spaces, and NBSP-only nodes.
- [ ] Step 2: Normalize contiguous NBSP runs to a regular space.
- [ ] Step 3: Ensure entity decoding/encoding does not create surprising double entities.
- [ ] Step 4: Update stats.
- [ ] Step 5: Run tests.
- [ ] Step 6: Commit:
```bash
git add src/transforms/nbsp.ts tests/transforms/nbsp.test.ts
git commit -m "feat: normalize nbsp whitespace"
```

### Task 9: Implement empty-node detection and removal

**Files:**
- Create: `src/transforms/empty.ts`
- Create: `tests/transforms/empty.test.ts`

**Interfaces:**
```ts
isVoidElement(tagName: string): boolean
isNodeEmpty(node: Element): boolean
removeEmptyElements(): HtmlTransform
```

- [ ] Step 1: Define the HTML void-element set explicitly.
- [ ] Step 2: Test empty elements, whitespace-only elements, NBSP-only elements, and void elements.
- [ ] Step 3: Implement `isNodeEmpty` based on descendant text/content after NBSP normalization.
- [ ] Step 4: Recursively remove empty non-void elements from deepest descendants upward.
- [ ] Step 5: Update `removedEmptyNodes`.
- [ ] Step 6: Run tests.
- [ ] Step 7: Commit:
```bash
git add src/transforms/empty.ts tests/transforms/empty.test.ts
git commit -m "feat: remove empty html elements"
```

### Task 10: Implement span, image, and link handling

**Files:**
- Create: `src/transforms/spans.ts`
- Create: `src/transforms/images.ts`
- Create: `src/transforms/links.ts`
- Create: corresponding tests.

**Interfaces:**
```ts
removeSpans(): HtmlTransform
removeImages(): HtmlTransform
removeLinks(): HtmlTransform
```

- [ ] Step 1: Test span unwrapping with text and nested children.
- [ ] Step 2: Test anchor unwrapping while preserving text/content.
- [ ] Step 3: Test image removal.
- [ ] Step 4: Implement parent-child replacement for unwrapping transforms.
- [ ] Step 5: Implement image node deletion.
- [ ] Step 6: Update stats.
- [ ] Step 7: Test nested and repeated cases.
- [ ] Step 8: Commit:
```bash
git add src/transforms/{spans,images,links}.ts tests/transforms
git commit -m "feat: add span image and link cleanup"
```

### Task 11: Implement tag stripping

**Files:**
- Create: `src/transforms/strip-tags.ts`
- Create: `tests/transforms/strip-tags.test.ts`

**Interface:**
```ts
stripAllTags(preserveBreaks: boolean): HtmlTransform
```

- [ ] Step 1: Define expected handling for paragraphs, headings, lists, line breaks, and nested formatting.
- [ ] Step 2: Write tests for `preserveBreaks: false`.
- [ ] Step 3: Write tests for `preserveBreaks: true`, where block boundaries and `<br>` generate readable line breaks.
- [ ] Step 4: Implement conversion of element children into text nodes and controlled newline text nodes.
- [ ] Step 5: Ensure scripts/styles are not accidentally interpreted as visible content if they remain in the tree; document and test the behavior.
- [ ] Step 6: Run focused tests.
- [ ] Step 7: Commit:
```bash
git add src/transforms/strip-tags.ts tests/transforms/strip-tags.test.ts
git commit -m "feat: add full tag stripping"
```

---

# Phase 4: Tables

### Task 12: Implement table removal and table-to-div transformation

**Files:**
- Create: `src/transforms/tables.ts`
- Create: `tests/transforms/tables.test.ts`

**Interfaces:**
```ts
removeTables(): HtmlTransform
tablesToDivs(): HtmlTransform
```

- [ ] Step 1: Write fixtures for simple table, `thead/tbody/tfoot`, `th`, nested content, `rowspan`, and `colspan`.
- [ ] Step 2: Implement `removeTables()` by replacing table-related structural elements with their children where appropriate, preserving descendant content.
- [ ] Step 3: Explicitly define behavior for table-related tags: `table`, `thead`, `tbody`, `tfoot`, `tr`, `td`, `th`, `caption`, `colgroup`, `col`.
- [ ] Step 4: Implement `tablesToDivs()` using the same hierarchy but replacing table-related element names with `div`.
- [ ] Step 5: Preserve child ordering.
- [ ] Step 6: Add tests proving that mutually exclusive modes do not accidentally run together.
- [ ] Step 7: Run focused tests.
- [ ] Step 8: Commit:
```bash
git add src/transforms/tables.ts tests/transforms/tables.test.ts
git commit -m "feat: add table cleanup transforms"
```

---

# Phase 5: Formatter

### Task 13: Implement deterministic HTML formatting

**Files:**
- Create: `src/formatter/format.ts`
- Create: `tests/formatter/format.test.ts`

**Interfaces:**
```ts
formatHtml(root: Root, options: FormatOptions): void
```

- [ ] Step 1: Define formatting rules in tests: indentation width, block vs inline nodes, inline whitespace preservation, newline style, and final newline.
- [ ] Step 2: Implement a formatter that operates on the AST without reparsing HTML.
- [ ] Step 3: Make `indent` support numeric spaces and tab.
- [ ] Step 4: Make newline output support LF and CRLF.
- [ ] Step 5: Ensure inline formatting does not produce visually destructive spaces.
- [ ] Step 6: Add tests for nested blocks, inline elements, lists, tables converted to divs, and text-only output.
- [ ] Step 7: Run formatter tests and integration tests.
- [ ] Step 8: Commit:
```bash
git add src/formatter tests/formatter
git commit -m "feat: add deterministic html formatter"
```

---

# Phase 6: Cleaner Engine

### Task 14: Assemble options into an executable cleaner

**Files:**
- Create: `src/core/cleaner.ts`
- Modify: `src/core/types.ts`
- Create: `tests/core/cleaner.test.ts`

**Interfaces:**
```ts
cleanHtml(input: string, options?: Partial<CleanerOptions>): CleanResult
createDefaultOptions(): CleanerOptions
```

- [ ] Step 1: Write integration tests using several options together.
- [ ] Step 2: Implement the default-option merge.
- [ ] Step 3: Build ordered transform selection based on enabled options.
- [ ] Step 4: Parse input once.
- [ ] Step 5: Run transforms once over the AST.
- [ ] Step 6: Format the AST if `format` is enabled.
- [ ] Step 7: Serialize once and return `CleanResult`.
- [ ] Step 8: Add pipeline-order tests for transformations where ordering is behaviorally significant.
- [ ] Step 9: Run full test suite.
- [ ] Step 10: Commit:
```bash
git add src/core/cleaner.ts src/core/types.ts tests/core/cleaner.test.ts
git commit -m "feat: assemble html cleaner engine"
```

### Task 15: Export the public library API

**Files:**
- Modify: `src/index.ts`
- Create: `tests/core/public-api.test.ts`

**Interface:**
```ts
export {
  cleanHtml,
  createDefaultOptions,
  type CleanerOptions,
  type CleanResult,
  type TransformStats
}
```

- [ ] Step 1: Write a public-import test from `src/index.ts`.
- [ ] Step 2: Export only stable public functions/types.
- [ ] Step 3: Ensure internal transform implementations are not accidentally required as public API.
- [ ] Step 4: Run typecheck and tests.
- [ ] Step 5: Commit:
```bash
git add src/index.ts tests/core/public-api.test.ts
git commit -m "feat: expose public cleaner api"
```

---

# Phase 7: Presets and Configuration

### Task 16: Implement presets

**Files:**
- Create: `src/presets/index.ts`
- Create: `src/presets/safe.ts`
- Create: `src/presets/clean.ts`
- Create: `src/presets/article.ts`
- Create: `src/presets/aggressive.ts`
- Create: `src/presets/text.ts`
- Create: `tests/presets/presets.test.ts`

**Interfaces:**
```ts
type PresetName = "safe" | "clean" | "article" | "aggressive" | "text"

getPreset(name: PresetName): CleanerOptions
listPresets(): PresetName[]
```

- [ ] Step 1: Define exact preset values in tests.
- [ ] Step 2: Implement `safe`.
- [ ] Step 3: Implement `clean`.
- [ ] Step 4: Implement `article`.
- [ ] Step 5: Implement `aggressive`.
- [ ] Step 6: Implement `text`.
- [ ] Step 7: Ensure returned objects are cloned and cannot mutate stored preset definitions.
- [ ] Step 8: Commit:
```bash
git add src/presets tests/presets
git commit -m "feat: add html cleaning presets"
```

### Task 17: Implement configuration-file loading and merging

**Files:**
- Create: `src/config/load.ts`
- Create: `src/config/merge.ts`
- Create: `tests/config/load.test.ts`
- Create: `tests/config/merge.test.ts`

**Interfaces:**
```ts
loadConfig(filePath: string): Promise<Partial<CleanerOptions>>
mergeOptions(
  defaults: CleanerOptions,
  preset: Partial<CleanerOptions>,
  config: Partial<CleanerOptions>,
  cli: Partial<CleanerOptions>
): CleanerOptions
```

- [ ] Step 1: Test valid JSON config.
- [ ] Step 2: Test missing file with an explicit error.
- [ ] Step 3: Test malformed JSON with file path and parse error in the message.
- [ ] Step 4: Test precedence as defaults → preset → config → CLI.
- [ ] Step 5: Implement config loading.
- [ ] Step 6: Implement deterministic merge.
- [ ] Step 7: Validate enum values such as `indent` and `newline`.
- [ ] Step 8: Commit:
```bash
git add src/config tests/config
git commit -m "feat: add cleaner configuration loading"
```

---

# Phase 8: CLI

### Task 18: Implement argument parsing

**Files:**
- Create: `src/cli/args.ts`
- Create: `src/cli/help.ts`
- Create: `tests/cli/args.test.ts`

**Interfaces:**
```ts
parseArgs(argv: string[]): ParsedCliOptions
```

`ParsedCliOptions` must include input paths, output path, write flag, check flag, preset, config path, stdin/stdout mode, and all cleaner flags.

- [ ] Step 1: Add CLI parsing tests for a single input path.
- [ ] Step 2: Add tests for `-o/--output`, `-w/--write`, `--check`, `--preset`, and `--config`.
- [ ] Step 3: Add tests for all transformation flags.
- [ ] Step 4: Add tests for repeated `--keep-attr` and `--remove-attr`.
- [ ] Step 5: Add tests for invalid preset and invalid numeric indent.
- [ ] Step 6: Implement Commander-based parser.
- [ ] Step 7: Keep CLI parsing separate from cleaner business logic.
- [ ] Step 8: Commit:
```bash
git add src/cli/args.ts src/cli/help.ts tests/cli/args.test.ts
git commit -m "feat: add cleaner cli argument parser"
```

### Task 19: Implement file and stdin/stdout I/O

**Files:**
- Modify: `src/cli/index.ts`
- Create: `src/cli/io.ts`
- Create: `tests/cli/io.test.ts`

**Interfaces:**
```ts
readInput(path?: string): Promise<string>
writeOutput(content: string, path?: string, writeInPlace?: boolean): Promise<void>
```

- [ ] Step 1: Test reading a file.
- [ ] Step 2: Test reading stdin through a mocked stream.
- [ ] Step 3: Test writing to a new output file.
- [ ] Step 4: Test in-place write mode.
- [ ] Step 5: Test refusal to overwrite unexpectedly when both input and output resolve to the same file unless `--write` is used.
- [ ] Step 6: Implement UTF-8 I/O.
- [ ] Step 7: Ensure all file-system errors include the path.
- [ ] Step 8: Commit:
```bash
git add src/cli/io.ts tests/cli/io.test.ts
git commit -m "feat: add cli input and output handling"
```

### Task 20: Implement executable CLI entrypoint

**Files:**
- Modify: `src/cli/index.ts`
- Create: `tests/cli/integration.test.ts`

**Interfaces:**
- CLI flow:
```text
parse args
→ resolve preset/config/options
→ read input
→ cleanHtml
→ write stdout/file
→ report errors
→ exit with defined code
```

- [ ] Step 1: Add end-to-end tests for file → stdout.
- [ ] Step 2: Add file → output-file test.
- [ ] Step 3: Add `--write` test.
- [ ] Step 4: Add stdin → stdout test.
- [ ] Step 5: Add invalid-argument test with exit code 2.
- [ ] Step 6: Add input-file failure test with exit code 1.
- [ ] Step 7: Implement CLI entrypoint and process exit-code mapping.
- [ ] Step 8: Add `--version` and `--help`.
- [ ] Step 9: Build the executable and run it against a real fixture.
- [ ] Step 10: Commit:
```bash
git add src/cli/index.ts tests/cli/integration.test.ts
git commit -m "feat: add html-cleaner executable"
```

---

# Phase 9: Reporting and CI-oriented Features

### Task 21: Implement `--check`

**Files:**
- Modify: `src/cli/index.ts`
- Create: `tests/cli/check.test.ts`

**Behavior:**
- Exit `0` when cleaned output equals input.
- Exit `4` when cleaning would change the input.

- [ ] Step 1: Write both unchanged and changed tests.
- [ ] Step 2: Implement exact byte/string comparison after cleaning.
- [ ] Step 3: Ensure `--check` does not write files.
- [ ] Step 4: Run focused tests.
- [ ] Step 5: Commit:
```bash
git add src/cli/index.ts tests/cli/check.test.ts
git commit -m "feat: add ci check mode"
```

### Task 22: Implement cleaning statistics and `--report`

**Files:**
- Modify: `src/cli/index.ts`
- Create: `src/cli/report.ts`
- Create: `tests/cli/report.test.ts`

**Interface:**
```ts
formatReport(stats: TransformStats): string
```

- [ ] Step 1: Write expected human-readable report output.
- [ ] Step 2: Implement deterministic report formatting.
- [ ] Step 3: Add `--report` support.
- [ ] Step 4: Ensure report output can be sent to stderr so cleaned HTML remains valid stdout.
- [ ] Step 5: Test that `cat input | html-clean --report > output.html` still produces clean HTML in stdout.
- [ ] Step 6: Commit:
```bash
git add src/cli/report.ts src/cli/index.ts tests/cli/report.test.ts
git commit -m "feat: add cleaner statistics report"
```

---

# Phase 10: Integration Fixtures and Real-World Validation

### Task 23: Add realistic HTML fixtures

**Files:**
- Create: `tests/fixtures/wordpress.html`
- Create: `tests/fixtures/google-docs.html`
- Create: `tests/fixtures/microsoft-word.html`
- Create: `tests/fixtures/rich-text-editor.html`
- Create: `tests/fixtures/copied-webpage.html`
- Create: `tests/fixtures/messy-table.html`
- Create: `tests/fixtures/heavily-nested.html`
- Create: corresponding expected outputs under `tests/fixtures/expected/`
- Create: `tests/integration/fixtures.test.ts`

- [ ] Step 1: Add representative messy HTML inputs.
- [ ] Step 2: Define expected outputs for each supported preset.
- [ ] Step 3: Implement fixture-driven tests.
- [ ] Step 4: Verify repeated runs produce byte-stable output.
- [ ] Step 5: Verify the tool does not crash on malformed but parseable HTML.
- [ ] Step 6: Commit:
```bash
git add tests/fixtures tests/integration/fixtures.test.ts
git commit -m "test: add real world html cleanup fixtures"
```

---

# Phase 11: Quality, Performance, and Compatibility

### Task 24: Add idempotence and composition tests

**Files:**
- Create: `tests/integration/idempotence.test.ts`
- Modify: relevant transform tests as needed.

**Requirement:**
For supported cleaner operations, where formatting is deterministic:

```ts
cleanHtml(cleanHtml(input, options).html, options).html
```

should equal:

```ts
cleanHtml(input, options).html
```

- [ ] Step 1: Add idempotence tests across representative inputs and presets.
- [ ] Step 2: Identify any non-idempotent transformation.
- [ ] Step 3: Fix transformation ordering or normalization.
- [ ] Step 4: Add tests for combinations such as `remove-spans + remove-empty`, `convert-bold + remove-attributes`, and `collapse-nbsp + remove-empty`.
- [ ] Step 5: Run the full suite.
- [ ] Step 6: Commit:
```bash
git add tests/integration
git commit -m "test: enforce cleaner idempotence"
```

### Task 25: Add performance benchmarks

**Files:**
- Create: `bench/cleaner.bench.ts`
- Create: `bench/fixtures/10kb.html`
- Create: `bench/fixtures/100kb.html`
- Create: `bench/fixtures/1mb.html`

- [ ] Step 1: Create representative benchmark files.
- [ ] Step 2: Measure `cleanHtml` for each fixture with `clean` and `aggressive` presets.
- [ ] Step 3: Record parse/transform/stringify timing where the benchmark API allows it.
- [ ] Step 4: Ensure no transformation reparses the document.
- [ ] Step 5: Document benchmark commands in `README.md`.
- [ ] Step 6: Commit:
```bash
git add bench README.md
git commit -m "perf: add html cleaning benchmarks"
```

### Task 26: Add Node and Bun compatibility checks

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

- [ ] Step 1: Add Node 20, Node 22, and current Node LTS test matrix.
- [ ] Step 2: Add Bun compatibility job.
- [ ] Step 3: Run tests, typecheck, build, and CLI smoke tests in each environment.
- [ ] Step 4: Add Linux, macOS, and Windows coverage where practical.
- [ ] Step 5: Commit:
```bash
git add .github/workflows/ci.yml package.json
git commit -m "ci: add node and bun compatibility checks"
```

---

# Phase 12: Documentation and Release Readiness

### Task 27: Write complete CLI documentation

**Files:**
- Modify: `README.md`
- Create: `docs/usage.md`
- Create: `docs/options.md`
- Create: `docs/configuration.md`
- Create: `docs/presets.md`
- Create: `docs/library-api.md`

- [ ] Step 1: Document installation:
```bash
npm install -g html-cleaner-cli
```

- [ ] Step 2: Document the basic command:
```bash
html-cleaner input.html -o output.html
```

- [ ] Step 3: Document stdin/stdout:
```bash
cat input.html | html-cleaner > cleaned.html
```

- [ ] Step 4: Document every transformation flag with before/after examples.
- [ ] Step 5: Document table semantics precisely.
- [ ] Step 6: Document configuration precedence.
- [ ] Step 7: Document all presets and their exact enabled operations.
- [ ] Step 8: Document exit codes.
- [ ] Step 9: Document Node and Bun support.
- [ ] Step 10: Document the library API.
- [ ] Step 11: Explicitly state that the normal cleaner is not a security sanitizer.
- [ ] Step 12: Commit:
```bash
git add README.md docs
git commit -m "docs: add cli usage and api documentation"
```

### Task 28: Add package metadata and release checks

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `.npmignore` only if needed after verifying package contents.

- [ ] Step 1: Add `files` so npm contains only `dist`, license, README, and necessary metadata.
- [ ] Step 2: Add repository, bugs, homepage, keywords, license, and author fields with real project values only.
- [ ] Step 3: Verify executable permissions on the CLI entry.
- [ ] Step 4: Run:
```bash
pnpm pack --dry-run
```
and inspect package contents.
- [ ] Step 5: Run:
```bash
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
```
- [ ] Step 6: Install the packed tarball into a temporary directory and run:
```bash
html-cleaner --help
html-cleaner --version
echo '<p class="x">Hello</p>' | html-cleaner --remove-classes
```
- [ ] Step 7: Commit:
```bash
git add package.json README.md CHANGELOG.md .npmignore
git commit -m "chore: prepare package for npm release"
```

---

# Exact Initial CLI Surface

The implementation should support these commands/options by the end of v1:

```text
html-cleaner [input]

Input/output:
  -o, --output <file>          Write output to file
  -w, --write                  Modify input file in place
      --stdin                  Read stdin explicitly
      --stdout                 Write stdout explicitly
      --check                  Exit 4 if output would change
      --report                 Print cleanup statistics to stderr

Cleaning:
      --preset <name>
      --config <file>
      --remove-attributes
      --keep-attr <name>
      --remove-attr <name>
      --remove-styles
      --remove-classes
      --remove-ids
      --strip-tags
      --preserve-breaks
      --collapse-nbsp
      --remove-empty-nbsp
      --convert-bold
      --convert-italic
      --remove-empty
      --remove-spans
      --remove-images
      --remove-links
      --remove-tables
      --tables-to-div
      --remove-comments

Formatting:
      --format
      --indent <number|tab>
      --newline <lf|crlf>
      --no-final-newline

General:
  -h, --help
  -V, --version
```

---

# Recommended Default Behavior

The bare command should perform conservative cleanup rather than aggressive content deletion:

```text
Default:
  remove comments
  collapse excessive NBSP
  remove empty tags
  convert b → strong
  convert i → em
  format deterministically
```

It should NOT by default:

```text
remove images
remove links
remove tables
strip all tags
remove every attribute
remove classes/IDs
```

Those operations are destructive and should require explicit flags or a preset.

---

# Explicit Preset Definitions

## `safe`

```ts
{
  removeComments: true,
  collapseNbsp: true,
  removeEmpty: true,
  convertBold: true,
  convertItalic: true,
  format: true
}
```

## `clean`

```ts
{
  removeComments: true,
  removeStyles: true,
  removeClasses: true,
  removeIds: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  format: true
}
```

## `article`

```ts
{
  removeComments: true,
  removeStyles: true,
  removeClasses: true,
  removeIds: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  removeSpans: true,
  removeImages: true,
  removeLinks: true,
  format: true
}
```

## `aggressive`

```ts
{
  removeComments: true,
  removeAttributes: true,
  collapseNbsp: true,
  removeEmptyNbsp: true,
  convertBold: true,
  convertItalic: true,
  removeEmpty: true,
  removeSpans: true,
  removeImages: true,
  removeLinks: true,
  removeTables: true,
  format: true
}
```

## `text`

```ts
{
  stripTags: true,
  preserveBreaksWhenStripping: true,
  collapseNbsp: true,
  removeComments: true,
  format: false
}
```

---

# Required Behavioral Decisions

The agent must not silently invent semantics for these cases. Implement exactly as specified here.

### Attribute removal

`--remove-attributes` removes ordinary attributes except names passed through `--keep-attr`.

`--remove-styles`, `--remove-classes`, and `--remove-ids` are independent convenience transformations.

### Link removal

`--remove-links` unwraps `<a>` while retaining its content.

### Span removal

`--remove-spans` unwraps `<span>` while retaining its content.

### Image removal

`--remove-images` deletes `<img>` elements.

### Empty tags

`--remove-empty` removes non-void elements that contain no meaningful content after whitespace/NBSP normalization.

### NBSP

`--collapse-nbsp` collapses successive NBSP characters into normal spaces.

`--remove-empty-nbsp` allows nodes containing only spaces/NBSP to qualify as empty.

### Table removal

`--remove-tables` preserves descendant content but removes table-specific structure.

### Table conversion

`--tables-to-div` replaces table-specific element names with `div` while preserving hierarchy and child order.

### Tag stripping

`--strip-tags` removes all element markup and retains textual content.

`--preserve-breaks` adds readable line boundaries between block elements and explicit `<br>` nodes.

---

# Definition of Done

The project is complete for v1 only when all of the following are true:

- [ ] `html-cleaner` executable builds successfully.
- [ ] The published package name is `html-cleaner-cli`.
- [ ] Node 20+ works.
- [ ] Bun compatibility test passes.
- [ ] HTML is parsed exactly once per cleaning operation.
- [ ] HTML is serialized exactly once per cleaning operation.
- [ ] No transformation uses regex to manipulate HTML structure.
- [ ] Every listed cleaning feature has unit tests.
- [ ] Every preset has tests.
- [ ] CLI parsing has integration tests.
- [ ] stdin/stdout, output-file, and in-place modes work.
- [ ] `--check` uses exit code 4 for differences.
- [ ] CLI errors use defined exit codes.
- [ ] Formatter output is deterministic.
- [ ] Supported fixtures are idempotent.
- [ ] Documentation covers every CLI option.
- [ ] The package tarball contains only intended production files.
- [ ] A packed install works from a clean temporary directory.
- [ ] The tool clearly distinguishes cleaning from sanitization.

---

# Final Implementation Order

The agent should execute tasks in this order and not skip ahead:

```text
1. Scaffold
2. Core types
3. Parser/stringifier
4. Transform pipeline
5. Comments
6. Attributes/styles/classes/IDs
7. Semantic conversions
8. NBSP
9. Empty tags
10. Spans/images/links
11. Strip tags
12. Tables
13. Formatter
14. Cleaner engine
15. Public API
16. Presets
17. Config
18. CLI args
19. CLI I/O
20. CLI executable
21. --check
22. --report
23. Real-world fixtures
24. Idempotence
25. Benchmarks
26. Node/Bun CI
27. Documentation
28. Release packaging
```

Every task must run its focused tests before committing. After every major phase, run the complete suite and typecheck before moving forward.

Final verification:

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test --run
pnpm build
pnpm pack --dry-run

printf '<p class="foo" style="color:red"><span><b>Hello</b></span>&nbsp;&nbsp;</p>\n' \
  | node dist/cli/index.js \
      --remove-styles \
      --remove-classes \
      --remove-spans \
      --convert-bold \
      --collapse-nbsp \
      --remove-empty
```

Expected cleaned output should be structurally equivalent to:

```html
<p><strong>Hello</strong> </p>
```

with the exact whitespace determined by the formatter specification and covered by its tests.
