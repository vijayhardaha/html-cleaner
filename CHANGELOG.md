# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-09-17

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

[Unreleased]: https://github.com/vijayhardaha/html-cleaner/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/vijayhardaha/html-cleaner/releases/tag/v0.1.0
