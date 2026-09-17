# AGENTS.md

> **This file serves as the authoritative reference for AI agents working on the `html-cleaner` codebase.**

## Project Overview

- **Type**: Node.js library and CLI tool (HTML cleaner / normalizer)
- **Lang**: TypeScript (strict mode)
- **Runtime**: Node.js >= 20 (Bun supported)
- **Build Tool**: Vite (two configs: library + CLI)
- **Package Manager**: bun
- **Test Runner**: Vitest, with a **100% coverage gate**
- **Package**: `@vijayhardaha/html-cleaner`, binary `html-cleaner`

It parses HTML into a HAST tree, applies a pipeline of composable transforms, and serializes once.
It is a **normalizer, not a security sanitizer** — never add or advertise sanitization guarantees.

## Available Commands

```bash
# Development
bun run dev            # rebuild the library on change
bun run dev:bin        # rebuild the CLI bundle on change

# Building
bun run build          # library (ESM + CJS + types) then the CLI bundle
bun run build:js       # library only, via vite.config.ts
bun run build:bin      # CLI bundle only, via vitebin.config.ts

# Testing
bun run test           # run the suite once
bun run test:watch     # watch mode
bun run test:coverage  # run with coverage; enforces 100% on all four metrics
bun run bench          # benchmarks under Bun (no build step needed)

# Linting & Formatting
bun run lint           # ESLint
bun run lint:fix       # ESLint with --fix
bun run lint:check     # ESLint with --max-warnings 0
bun run format         # Prettier auto-fix
bun run format:check   # Prettier validation

# Type Checking
bun run typecheck      # tsc --noEmit
```

If `bun install` fails on the `prepare` script (husky), prefix it with `HUSKY=0`. That skips hook
installation and the install completes normally, including lockfile writes. CI sets `HUSKY=0` too.

## Project Architecture

### Data flow

```
parse once -> N transforms -> format (optional) -> serialize once
```

Parsing and serialization each happen exactly once per run. Transforms mutate the tree in place.
**Never use regex to manipulate HTML structure** — that is the entire reason this project exists.

### Core Structure

- **Entry point:** `src/index.ts` — the public barrel. Only the cleaner engine and its stable types
  are exported; internal transforms stay private.
- **Engine:**
  - `src/core/cleaner.ts` — `cleanHtml`, `resolveOptions`, `buildTransforms`, and output finalization
  - `src/core/types.ts` — `CleanerOptions`, `TransformStats`, `CleanResult`, `DEFAULT_OPTIONS`
  - `src/core/pipeline.ts` — runs transforms in order
  - `src/core/context.ts` — builds the per-run `TransformContext`
  - `src/core/tree.ts` — shared HAST helpers (`visitContent`, `attributeName`, `removeProperty`)
  - `src/core/text-rules.ts`, `src/core/void-elements.ts` — tag sets
- **Parsing:** `src/parser/parse.ts`, `src/parser/stringify.ts`
- **Transforms:** `src/transforms/*.ts` — one file per transform
- **Formatting:** `src/formatter/format.ts` — deterministic, AST-based
- **Presets:** `src/presets/{safe,clean,article,aggressive,text}.ts` + `index.ts`
- **Config:** `src/config/load.ts` (read + validate), `src/config/merge.ts` (precedence)
- **CLI:**
  - `src/cli/index.ts` — entry point, orchestration, exit-code mapping
  - `src/cli/args.ts` — Commander program to `ParsedCliOptions`
  - `src/cli/help.ts` — names, exit codes, option descriptions
  - `src/cli/io.ts` — file/stdin/stdout access with path-named errors
  - `src/cli/report.ts` — human-readable stats for `--report`

### Build Outputs

- Library: ESM `dist/index.js` and CJS `dist/index.cjs`
- CLI: CJS only, `dist/cli/index.cjs`, with shebang injection and the executable bit set
- Types: `.d.ts` emitted to `types/` via `vite-plugin-dts`
- Dependencies are bundled into the output (see Build & Packaging Rules)

## Naming Conventions

- Files: `kebab-case` for multi-word modules (`strip-tags.ts`, `text-rules.ts`)
- Functions/Variables: `camelCase` (`cleanHtml`, `buildTransforms`)
- Types/Interfaces: `PascalCase` (`CleanerOptions`, `HtmlTransform`)
- Constants: `SCREAMING_SNAKE_CASE` (`DEFAULT_OPTIONS`, `PRESET_NAMES`)
- Transform `name` fields: `kebab-case` (`'strip-tags'`, `'tables-to-div'`)
- Test files: mirror the source path under `tests/` (`src/transforms/empty.ts` → `tests/transforms/empty.test.ts`)

## Rules

- Use `interface` for public API shapes and object types that may be extended; `type` for unions and
  computed types.
- No `any`. Use `unknown` when a type is genuinely uncertain.
- Avoid non-null assertions. Use optional chaining or explicit checks.
- Public types must be re-exported from `src/index.ts`.
- Every exported function and non-trivial helper carries a JSDoc block. `jsdoc/require-param`,
  `jsdoc/require-returns`, and `jsdoc/require-property-description` are enforced, and
  `lint:check` runs with `--max-warnings 0`, so warnings fail too.
- Interfaces need `@property` descriptions for every field.
- Import order is enforced by `import-x/order`: node builtins, blank line, external packages, blank
  line, relative imports.
- Each source file opens with a banner comment stating its purpose.
- `DEFAULT_OPTIONS` is frozen. Never mutate it — use `createDefaultOptions()`.
- Option precedence is **defaults → preset → config file → CLI flags**. Preserve it.
- Do not add runtime dependencies. Dependencies are bundled, so adding one bloats the published output.
- No `TODO`, `TBD`, placeholder implementations, or silently swallowed errors.

### JSDoc Example

```typescript
/**
 * Remove non-void elements that carry no meaningful content.
 *
 * @param {Element} node - Element to inspect.
 * @param {CleanerOptions} options - Resolved cleaner options.
 *
 * @returns {boolean} `true` when the element has no meaningful content.
 */
export function isNodeEmpty(node: Element, options: CleanerOptions): boolean {
  // implementation
}
```

### Adding a transform

1. Create `src/transforms/<name>.ts` exporting a function that returns an `HtmlTransform`
   (`{ name, apply(root, context) }`).
2. Mutate the tree in place and increment the relevant `context.stats` counters.
3. Add any new counter to `TransformStats` in `src/core/types.ts`.
4. Wire it into `buildTransforms` in `src/core/cleaner.ts`, in the correct order.
5. Add `tests/transforms/<name>.test.ts` and keep coverage at 100%.

## Testing

- Tests live in `tests/`, mirroring the `src/` layout. Vitest with `globals: true`.
- Use `runTransform(html, [transform], overrides)` from `tests/helpers/run-transform.ts` for
  single-transform tests instead of parsing and serializing by hand.
- Use `vi` for spies and mocks.
- **Idempotence matters.** `clean(clean(x))` must equal `clean(x)`.
  `tests/integration/idempotence.test.ts` guards this against real-world fixtures.
- Real-world fixtures live in `tests/fixtures/` with expected outputs under `tests/fixtures/expected/`.

### Reaching 100% coverage honestly

Coverage is gated at 100% for statements, branches, functions, and lines. When you add code, add
tests for it in the same change. If something genuinely cannot be executed from a test, prefer in
this order:

1. Test it for real.
2. Delete it if it is provably dead — for example a `?? fallback` where the value is typed
   non-optional and empirically never null.
3. Mark it with a `v8 ignore` hint **and** explain why in a comment above it.

Supported hints: `/* v8 ignore next */`, `/* v8 ignore next N */`, `/* v8 ignore if */`,
`/* v8 ignore else */`, `/* v8 ignore start */ ... /* v8 ignore stop */`.

**Trap:** for `if (x instanceof Y) { ... } else { throw }` where the `else` is unreachable, ignoring
**only the `throw` line does not work** — the uncovered element is the false branch of the `if`,
which lives on the `if` line. Reshape it so the whole block falls inside the ignored range:

```typescript
/* v8 ignore next 3 */
if (!(x instanceof Y)) {
  throw error;
}
```

## Build & Packaging Rules

- The build is **Vite only**. Do not reintroduce esbuild.
- Vite 8 uses **rolldown**, not rollup. Import plugin types from `rolldown` (`Plugin`,
  `OutputBundle`, `NormalizedOutputOptions`).
- The CLI bundle uses `ssr: { noExternal: true }` so ESM-only dependencies are inlined. Without it
  the CJS output throws `ERR_REQUIRE_ESM` on Node 20. Keep it.
- Source maps are disabled in both configs. Keep them off.
- Declarations come from `vite-plugin-dts` with `include: ['src']`. Without that restriction the
  plugin emits declarations for the whole program, including tests and config files.
- Do not commit build output. `dist/` and `types/` are gitignored.

## Traps

1. **Never detect "is this the main module" with**
   `import.meta.url === pathToFileURL(process.argv[1]).href`.
   Package managers run a bin through a symlink in `node_modules/.bin`, so `process.argv[1]` is the
   symlink while `import.meta.url` is the real path — they never match, and the CLI exits silently
   with code 0. Compare `realpathSync()` on both sides. `tests/cli/bin-symlink.test.ts` guards this
   against the built bundle.

2. **`@types/hast` must stay in `dependencies`, not `devDependencies`.** The published `.d.ts` files
   import from `hast`, so TypeScript consumers need it resolvable. Every other runtime dependency is
   bundled into `dist` and belongs in `devDependencies`.

3. **Vitest 5 has no `bench()` API.** It is neither exported from `vitest` nor provided as a global,
   even though the `vitest bench` CLI still exists and will try to run a `*.bench.ts` file. That is a
   confusing dead end. Benchmarks live in `bench/cleaner.bench.ts` as a plain script run by Bun. Do
   not convert it back to a Vitest suite.

## Documentation

User-facing docs live in `docs/` and are linked from the README. When behaviour changes, update the
matching guide: `docs/options.md` for flags, `docs/presets.md` for preset values,
`docs/configuration.md` for config keys, `docs/library-api.md` for the public API.

**Every example in `docs/` and the README must be generated by running the tool**, never written by
hand. Hand-written examples have been wrong here before — invented report counters, an incorrect
`buildTransforms` result, and a missing `tbody` in a table example. Run the command and paste the
real output.

## Git Workflow

The default branch is **`master`**, not `main` — use it in workflow triggers, badge URLs, and PR
targets.

The `pre-push` hook runs `format:check`, `typecheck`, and `lint`. The `commit-msg` hook runs
commitlint. Do not bypass hooks with `--no-verify`.

**Before preparing a commit:**

1. `bun run typecheck`
2. `bun run format:check`
3. `bun run lint:check`
4. `bun run test:coverage`

**After completing a task:**

1. Check unstaged changes: `git status --porcelain` and `git diff`
2. Stage files: `git add <files>`
3. Create `.tmp/git.md` containing the staged files and the commit command
4. Create separate commits for each logical change; group changes only when they touch the same kind
   of file

Example `.tmp/git.md`:

```bash
git add src/transforms/empty.ts tests/transforms/empty.test.ts
git commit -m "feat(transforms): skip comment-only elements when pruning empties

- treat an element whose only child is a comment as empty
- cover the new branch"
```

## Commit Conventions

**Format:** `<type>(<scope>): <summary>`

**Types:** `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`,
`test`

**Rules:** Subject line under 50 characters, lowercase, no trailing period. Body (optional) wrapped
at 72 characters. Enforced by commitlint using `@commitlint/config-conventional`.

**Examples:**

- `feat(cli): add --report flag`
- `fix(formatter): stop stacking newlines on re-clean`
- `docs: document table semantics`
- `build: switch the CLI bundle to vite`
