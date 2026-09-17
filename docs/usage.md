# Usage

Practical recipes. For the full flag reference see [options.md](./options.md).

## The basics

```bash
html-cleaner input.html                       # clean a file, print to stdout
html-cleaner input.html --output clean.html   # write to another file
html-cleaner --write input.html               # clean in place
cat input.html | html-cleaner > clean.html    # pipe in, pipe out
```

If you pass no input file, stdin is read. If you pass no `--output` and no `--write`, stdout is
written. `--stdin` and `--stdout` exist to be explicit when a script's intent would otherwise be
unclear.

## Piping and shell safety

Because the cleaned HTML goes to stdout and every diagnostic goes to stderr, pipes stay clean:

```bash
html-cleaner --report input.html > clean.html
# clean.html contains only HTML; the report went to your terminal
```

Cleaning in a loop:

```bash
for file in *.html; do
  html-cleaner --write --preset clean "$file"
done
```

Use `--` if a filename starts with a dash:

```bash
html-cleaner -- --weird-name.html
```

## Using it as a CI or pre-commit gate

`--check` exits `4` when cleaning would change the input, and never writes anything:

```bash
html-cleaner --check --preset clean src/**/*.html
```

```bash
if ! html-cleaner --check --config cleaner.json page.html; then
  echo "page.html is not clean; run: html-cleaner --write --config cleaner.json page.html" >&2
  exit 1
fi
```

Because `0` means "already clean" and `4` means "would change", the check is usable directly as a
command — no output parsing required.

## Cleaning pasted editor content

Content pasted out of Google Docs, Word, or a rich-text editor arrives with a thick layer of
presentation markup. `article` is tuned for it:

```bash
html-cleaner --preset article pasted.html --output article.html
```

`article` removes comments, inline styles, classes, and ids; unwraps spans and links; and drops
images. If you want to keep images, add `--remove-images` off by overriding — presets are just
defaults, so pass the flags you want:

```bash
html-cleaner --preset clean --remove-spans pasted.html
```

## Reducing a page to readable text

`text` strips every tag and keeps line breaks at block boundaries, which is handy for search
indexing, diffing, or feeding prose into another tool:

```bash
html-cleaner --preset text article.html > article.txt
```

`<script>`, `<style>`, `<template>`, `<noscript>`, and `<head>` content is dropped rather than
surfaced as text, because it is not visible content.

## Flattening a table into content

Two mutually exclusive strategies:

```bash
# Keep the cell text, drop the table structure
html-cleaner --remove-tables report.html

# Keep the hierarchy, rename table elements to divs
html-cleaner --tables-to-div report.html
```

If both flags are passed, `--remove-tables` wins. See
[options.md](./options.md#semantics-worth-knowing) for exactly which elements are affected.

## Checking what a run would do

`--report` prints counters to stderr, so you can see the impact before committing to a change:

```bash
html-cleaner --preset aggressive --report messy.html | head
```

Combine with `--check` to assert a budget in CI — for example, fail if a document still has
comments after cleaning:

```bash
html-cleaner --report --check --preset clean page.html 2> report.txt
grep -q 'comments removed: 0' report.txt || echo "comments survived"
```

## Node and Bun

Both runtimes are supported on Node 20 or newer. The CLI is a CommonJS bundle with a Node shebang,
so it runs the same way under either:

```bash
node dist/cli/index.cjs --version
bun  dist/cli/index.cjs --version
```

Via a package manager's bin shim (`npx`, `bunx`, `pnpm exec`), the executable is resolved through a
symlink — the CLI detects that correctly, so all of them work.

## Exit codes

| Code | Meaning                                          |
| ---- | ------------------------------------------------ |
| `0`  | Success                                          |
| `1`  | Input, output, or configuration error            |
| `2`  | Invalid usage                                    |
| `4`  | `--check` found that cleaning would change input |
