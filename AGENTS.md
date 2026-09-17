# AGENTS.md

Guidance for AI coding agents working in this repository. Read this before making changes.

## What this project is

`@vijayhardaha/html-cleaner` — a CLI and library that cleans messy HTML. It parses HTML into a
[HAST](https://github.com/syntax-tree/hast) tree with `rehype-parse`, applies a pipeline of small
composable transforms, optionally formats, then serializes once with `rehype-stringify`.

It is a **normalizer, not a security sanitizer**. Do not add or advertise sanitization guarantees.

## Commands

Use `bun` (it is not always on `PATH`; prefer `~/.bun/bin/bun` or `npx`).

```bash
bun install
bun run build           # library (ESM + CJS + types) then the CLI bundle
bun run build:js        # library only
bun run build:bin       # CLI bundle only
bun run test
bun run test:coverage   # enforces 100% on statements/branches/functions/lines
bun run typecheck
bun run lint            # add --fix via bun run lint:fix
bun run format
```

Before handing work back, run `typecheck`, `lint:check`, `format:check`, and `test:coverage`.

## Architecture

```
src/
  index.ts          Public barrel — the only supported entry point for consumers
  cli/
    index.ts        Entry point: option resolution, orchestration, exit codes
    args.ts         Commander program -> ParsedCliOptions
    help.ts         Names, exit codes, option descriptions
    io.ts           File/stdin/stdout access with path-named errors
    report.ts       Human-readable stats for --report
  config/           Config file loading and option merging
  core/
    cleaner.ts      Engine: resolveOptions, buildTransforms, cleanHtml
    types.ts        CleanerOptions, TransformStats, CleanResult, DEFAULT_OPTIONS
    pipeline.ts     Runs transforms in order
    tree.ts         Shared HAST helpers (visitContent, attributeName, ...)
    text-rules.ts   Tag sets for text extraction
    void-elements.ts
    context.ts      Builds the per-run TransformContext
  formatter/        Deterministic AST formatting
  parser/           parse/stringify wrappers
  presets/          safe | clean | article | aggressive | text
  transforms/       One file per transform (attributes, classes, comments, empty, ...)
```

Data flow: `parse -> N transforms -> format -> serialize`. Parsing and serialization each happen
exactly once per run; transforms mutate the tree in place.

## Conventions

**These are enforced by lint and reviewed — follow them.**

- Every exported function and non-trivial helper carries a JSDoc block in this shape:

  ```ts
  /**
   * Summary line.
   *
   * @param {string} name - Description.
   * @returns {boolean} Description.
   */
  ```

  Use `{type}` in `@param`/`@returns` even in TypeScript files; `jsdoc/require-param` and
  `jsdoc/require-returns` are on.

- Each source file opens with a banner comment stating its purpose.

- Import order is enforced by `import-x/order`: node builtins, blank line, external packages,
  blank line, relative imports. Run `bun run lint:fix` if unsure.

- Transforms are `HtmlTransform` objects (`{ name, apply(root, context) }`) that mutate in place
  and increment `context.stats`. Add a new transform by creating a file in `src/transforms/`,
  wiring it into `buildTransforms` in `src/core/cleaner.ts`, and adding a counter to
  `TransformStats` if it removes or converts anything.

- `DEFAULT_OPTIONS` is frozen. Never mutate it; use `createDefaultOptions()`.

- Option precedence is: defaults -> preset -> config file -> CLI flags. Preserve it.

## Testing

- Tests live in `tests/`, mirroring the `src/` layout. Vitest with globals enabled.
- Use `runTransform(html, [transform], overrides)` from `tests/helpers/run-transform.ts` for
  single-transform tests instead of parsing/serializing by hand.
- Idempotence matters: `clean(clean(x))` must equal `clean(x)`. `tests/integration/idempotence.test.ts`
  guards this against real-world fixtures.
- **Coverage is gated at 100%.** If you add code, add tests for it in the same change.

### Reaching 100% coverage honestly

Some code cannot be executed from tests. Prefer, in this order:

1. Test it for real.
2. Delete it if it is provably dead (for example a `?? fallback` where the value is typed
   non-optional and never null).
3. Mark it with a `v8 ignore` hint **and** say why in a comment above it.

Supported hints: `/* v8 ignore next */`, `/* v8 ignore next N */`, `/* v8 ignore if */`,
`/* v8 ignore else */`, `/* v8 ignore start */ ... /* v8 ignore stop */`.

Gotcha: for `if (x instanceof Y) { ... } else { throw }` where the `else` is unreachable, ignoring
**only the `throw` line does not work** — the uncovered element is the false branch of the `if`,
which lives on the `if` line. Reshape to:

```ts
/* v8 ignore next 3 */
if (!(x instanceof Y)) {
  throw error;
}
```

so the whole block falls inside the ignored range.

## Build and packaging

- Build is **Vite only**. Do not reintroduce esbuild. Two configs: `vite.config.ts` and
  `vitebin.config.ts`.
- Vite 8 uses **rolldown**, not rollup. Import plugin types from `rolldown`
  (`Plugin`, `OutputBundle`, `NormalizedOutputOptions`).
- The CLI bundle uses `ssr: { noExternal: true }` so ESM-only dependencies are inlined; without it
  the CJS output throws `ERR_REQUIRE_ESM` on Node 20. Keep it.
- Source maps are disabled in both configs. Keep them off.
- Declarations go to `types/` via `vite-plugin-dts` with `include: ['src']`. Without that
  restriction the plugin emits declarations for the whole program, including tests.

## Two traps worth knowing

1. **Never detect "is this the main module" with**
   `import.meta.url === pathToFileURL(process.argv[1]).href`.
   Package managers run a bin through a symlink in `node_modules/.bin`, so `process.argv[1]` is the
   symlink while `import.meta.url` is the real path — they never match, and the CLI exits silently.
   Compare `realpathSync()` on both sides. `tests/cli/bin-symlink.test.ts` guards this against the
   built bundle.

2. **`@types/hast` must stay in `dependencies`, not `devDependencies`.** The published `.d.ts`
   files import from `hast`, so TypeScript consumers need it available. All other runtime
   dependencies are bundled into `dist` and belong in `devDependencies`.

## Things not to do

- Do not add runtime dependencies. Dependencies are bundled; adding one bloats the output.
- Do not commit build output (`dist/`, `types/`) — both are gitignored.
- Do not change the public barrel (`src/index.ts`) casually. It is the supported consumer surface.
- Do not claim sanitization or security guarantees in docs, comments, or error messages.
