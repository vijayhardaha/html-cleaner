# Presets

Presets are named bundles of options. They are a starting point, not a mode — any individual flag
still overrides them.

## Using presets

```bash
html-cleaner --preset article input.html
html-cleaner --preset clean --remove-spans input.html   # preset plus an override
```

Precedence is **defaults → preset → config file → CLI flags**, so a flag always wins over its
preset value, and a config file wins over the preset but loses to a flag.

## The presets

| Preset       | What it's for                            |
| ------------ | ---------------------------------------- |
| `safe`       | Minimal, low-risk cleanup                |
| `clean`      | Strip presentation noise from a document |
| `article`    | Prepare body copy for publishing         |
| `aggressive` | Reduce markup to structure and content   |
| `text`       | Extract readable text, no markup at all  |

### `safe`

Only what the tool already does by default. Good when you want formatting and whitespace
normalization without losing anything.

```json
{
  "removeComments": true,
  "collapseNbsp": true,
  "removeEmpty": true,
  "convertBold": true,
  "convertItalic": true,
  "format": true
}
```

### `clean`

Adds removal of presentation attributes: inline styles, classes, and ids.

```json
{
  "removeComments": true,
  "removeStyles": true,
  "removeClasses": true,
  "removeIds": true,
  "collapseNbsp": true,
  "removeEmptyNbsp": true,
  "convertBold": true,
  "convertItalic": true,
  "removeEmpty": true,
  "format": true
}
```

### `article`

Everything in `clean`, plus unwrapping spans and links and dropping images. This is the usual choice
for pasted editor content that is going into a CMS.

```json
{
  "removeComments": true,
  "removeStyles": true,
  "removeClasses": true,
  "removeIds": true,
  "collapseNbsp": true,
  "removeEmptyNbsp": true,
  "convertBold": true,
  "convertItalic": true,
  "removeEmpty": true,
  "removeSpans": true,
  "removeImages": true,
  "removeLinks": true,
  "format": true
}
```

### `aggressive`

Removes **all** attributes (not just style/class/id), unwraps spans and links, removes images, and
removes table structure. Use when you want structure and content and nothing else.

```json
{
  "removeComments": true,
  "removeAttributes": true,
  "collapseNbsp": true,
  "removeEmptyNbsp": true,
  "convertBold": true,
  "convertItalic": true,
  "removeEmpty": true,
  "removeSpans": true,
  "removeImages": true,
  "removeLinks": true,
  "removeTables": true,
  "format": true
}
```

### `text`

Drops all markup and keeps readable text, with line breaks at block boundaries. Formatting is
disabled, so the result is plain text rather than HTML.

```json
{
  "stripTags": true,
  "preserveBreaksWhenStripping": true,
  "collapseNbsp": true,
  "removeComments": true,
  "format": false
}
```

## What each preset enables

| Option             | safe | clean | article | aggressive | text |
| ------------------ | ---- | ----- | ------- | ---------- | ---- |
| `removeComments`   | ✅   | ✅    | ✅      | ✅         | ✅   |
| `removeStyles`     | —    | ✅    | ✅      | —¹         | —    |
| `removeClasses`    | —    | ✅    | ✅      | —¹         | —    |
| `removeIds`        | —    | ✅    | ✅      | —¹         | —    |
| `removeAttributes` | —    | —     | —       | ✅         | —    |
| `collapseNbsp`     | ✅   | ✅    | ✅      | ✅         | ✅   |
| `removeEmptyNbsp`  | —    | ✅    | ✅      | ✅         | —    |
| `convertBold`      | ✅   | ✅    | ✅      | ✅         | —    |
| `convertItalic`    | ✅   | ✅    | ✅      | ✅         | —    |
| `removeEmpty`      | ✅   | ✅    | ✅      | ✅         | —    |
| `removeSpans`      | —    | —     | ✅      | ✅         | —    |
| `removeImages`     | —    | —     | ✅      | ✅         | —    |
| `removeLinks`      | —    | —     | ✅      | ✅         | —    |
| `removeTables`     | —    | —     | —       | ✅         | —    |
| `stripTags`        | —    | —     | —       | —          | ✅   |
| `preserveBreaks…`  | —    | —     | —       | —          | ✅   |
| `format`           | ✅   | ✅    | ✅      | ✅         | ❌   |

¹ `aggressive` does not set these individually — `removeAttributes` removes _every_ attribute,
which includes `style`, `class`, and `id`.

Cells marked `—` fall back to the default value. See the [defaults table](../README.md#defaults).

## Presets in the library

Presets are currently a CLI convenience. In the library, apply the equivalent options directly —
copy the JSON above into your `cleanHtml()` call:

```js
cleanHtml(input, {
  removeComments: true,
  removeStyles: true,
  removeClasses: true,
  removeIds: true,
  removeEmptyNbsp: true
});
```
