# Configuration

## Option precedence

Four sources feed every run. Later sources win, per option:

```
built-in defaults  ->  --preset  ->  --config file  ->  individual CLI flags
```

So a `--preset` never silently overrides something you set explicitly on the command line.

Array options (`keepAttributes`, `removeAttributeNames`) are **replaced**, not concatenated — the
winning source is always unambiguous. If your config lists `--keep-attr` values and you also pass
`--keep-attr` on the command line, the command-line list is the whole list.

## Config file format

A JSON object whose keys are the camelCase option names.

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

## Complete key reference

| Key                           | Type              | Default |
| ----------------------------- | ----------------- | ------- |
| `removeAttributes`            | `boolean`         | `false` |
| `keepAttributes`              | `string[]`        | `[]`    |
| `removeAttributeNames`        | `string[]`        | `[]`    |
| `removeStyles`                | `boolean`         | `false` |
| `removeClasses`               | `boolean`         | `false` |
| `removeIds`                   | `boolean`         | `false` |
| `stripTags`                   | `boolean`         | `false` |
| `preserveBreaksWhenStripping` | `boolean`         | `false` |
| `collapseNbsp`                | `boolean`         | `true`  |
| `removeEmptyNbsp`             | `boolean`         | `false` |
| `convertBold`                 | `boolean`         | `true`  |
| `convertItalic`               | `boolean`         | `true`  |
| `removeEmpty`                 | `boolean`         | `true`  |
| `removeSpans`                 | `boolean`         | `false` |
| `removeImages`                | `boolean`         | `false` |
| `removeLinks`                 | `boolean`         | `false` |
| `removeTables`                | `boolean`         | `false` |
| `tablesToDiv`                 | `boolean`         | `false` |
| `removeComments`              | `boolean`         | `true`  |
| `format`                      | `boolean`         | `true`  |
| `indent`                      | `number \| "tab"` | `2`     |
| `newline`                     | `"lf" \| "crlf"`  | `lf`    |
| `finalNewline`                | `boolean`         | `true`  |

## Validation

The config file is validated when it is read, and the merged result is validated again. Errors name
the file so you are never guessing which config was bad.

| Problem                           | Error                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------- |
| File missing or unreadable        | `Unable to read config file "<path>": <reason>`                                              |
| Malformed JSON                    | `Invalid JSON in config file "<path>": <parse error>`                                        |
| Not a JSON object (array, string) | `Config file "<path>" must contain a JSON object.`                                           |
| Bad `indent`                      | `Invalid config file "<path>" value for "indent": expected a non-negative integer or "tab".` |
| Bad `newline`                     | `Invalid config file "<path>" value for "newline": expected "lf" or "crlf".`                 |

`indent` must be a non-negative integer or the string `"tab"`. `newline` must be `"lf"` or `"crlf"`.

Any of these exits with code `1`.

## Recipes

**A shared house style** — commit one config and have everyone use it:

```json
{
  "removeComments": true,
  "removeStyles": true,
  "removeClasses": true,
  "removeIds": true,
  "removeEmpty": true,
  "convertBold": true,
  "convertItalic": true,
  "format": true,
  "indent": 2,
  "newline": "lf",
  "finalNewline": true
}
```

**Keep only the attributes you need:**

```json
{ "removeAttributes": true, "keepAttributes": ["href", "src", "alt", "title"] }
```

**Strip tracking and editor attributes but keep structure:**

```json
{ "removeAttributeNames": ["data-track", "data-analytics", "aria-describedby"] }
```

Names in `removeAttributeNames` are matched case-insensitively.
