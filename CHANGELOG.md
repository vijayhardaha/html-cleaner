# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-09-20

### Fixed

- `--remove-tables` no longer leaves orphaned whitespace-only text nodes behind when unwrapping
  table structure. The residue used to splice into the parent as text, and because the formatter
  deliberately leaves all-text containers untouched, it survived `--format` as stray blank lines
  and indentation (visible with the `aggressive` preset). When `collapseNbsp` is active, that
  inter-tag whitespace is now dropped during the unwrap.
- `--remove-empty` no longer leaves the whitespace-only sibling that preceded a removed element.
  The orphaned separator is dropped along with the element when `collapseNbsp` is active, so
  formatted output no longer ends with a trailing blank line where an empty element (for example
  `<p>&nbsp;</p>`) used to be. Inline spacing is preserved: text following a removed inline
  element, such as the space in `Hello <span></span>world`, is never touched.

Both behaviors remain opt-out via `collapseNbsp: false`, which keeps all original whitespace.

## [1.0.0] - 2026-09-17

Initial release.

### Added

- CLI (`html-cleaner`) and library (`@vijayhardaha/html-cleaner`) for cleaning messy HTML.
- Parse-once, transform, serialize-once pipeline built on `unified` / `rehype-parse` /
  `rehype-stringify`, operating on a HAST tree rather than on HTML text.
- Cleaning transforms: comment removal, attribute/style/class/id removal, NBSP normalization,
  `<b>` → `<strong>` and `<i>` → `<em>` conversion, empty-element removal, span and link unwrapping,
  image removal, table removal, table-to-`div` conversion, and full tag stripping with optional
  line breaks.
- Deterministic AST formatter with configurable `indent`, `newline`, and final-newline handling.
- Five presets: `safe`, `clean`, `article`, `aggressive`, and `text`.
- JSON configuration files with validated `indent` and `newline` values.
- Option precedence: defaults → preset → config file → CLI flags.
- CLI modes for stdout, file output, in-place writes, and stdin.
- `--check` mode for CI, exiting `4` when cleaning would change the input.
- `--report` mode printing per-run cleanup counters to stderr.
- Library API: `cleanHtml`, `resolveOptions`, `buildTransforms`, `createDefaultOptions`,
  `DEFAULT_OPTIONS`, and the associated TypeScript types.
- Dual ESM and CommonJS output with bundled dependencies, so the package has no runtime
  install footprint beyond `@types/hast` for TypeScript consumers.
- Real-world HTML fixtures (WordPress, Google Docs, Microsoft Word, rich-text editor, copied
  webpage, messy table, heavily nested) with expected outputs per preset.
- Idempotence tests asserting `clean(clean(x)) === clean(x)`.
- Benchmarks and a Node/Bun CI matrix.

### Notes

- This tool normalizes markup. It is **not** a security sanitizer and does not guarantee removal of
  dangerous content from untrusted input.

[1.0.1]: https://github.com/vijayhardaha/html-cleaner/releases/tag/v1.0.1
[1.0.0]: https://github.com/vijayhardaha/html-cleaner/releases/tag/v1.0.0
