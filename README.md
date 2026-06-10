<!--
SPDX-FileCopyrightText: 2026 Erik Michelson
SPDX-License-Identifier: MIT
-->

# constrain-object

Safely constrain untrusted objects by enforcing depth, node count, array length, object key count, string length, and type whitelist limits.
Detects and handles circular references. Optionally strips dangerous keys (`__proto__`, `constructor`, `prototype`) and removes disallowed types (functions, symbols, BigInts).
Zero dependencies.

## Installation

```bash
npm install constrain-object
```

## Browser

Use via CDN with a `<script>` tag. The library is exposed as the global `ConstrainObject`.

```html
<script src="https://cdn.jsdelivr.net/npm/constrain-object/dist/index.iife.js"></script>
<script>
  const { constrainObject } = ConstrainObject;
</script>
```

## Usage

```ts
import { constrainObject } from "constrain-object";

const input = {
  a: 1,
  b: { c: "a very long string", d: { key: "value" } },
  __proto__: { polluted: true },
};

const result = constrainObject(input, {
  maxStringLength: 6,
  maxDepth: 2,
});
// { a: 1, b: { c: 'a very', d: {} } }
```

## API

### `constrainObject(input, options?)`

Returns a constrained deep clone of `input`. The original is never mutated.

| Option            | Default                                     | Description                                                                 |
| ----------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `maxDepth`        | `20`                                        | Maximum nesting depth.                                                      |
| `maxNodes`        | `10_000`                                    | Maximum number of nodes (properties/values) to traverse.                    |
| `maxArrayLength`  | `1_000`                                     | Maximum array length.                                                       |
| `maxObjectKeys`   | `1_000`                                     | Maximum number of keys per object.                                          |
| `maxStringLength` | `10_000`                                    | Maximum string length.                                                      |
| `onCycle`         | `"null"`                                    | How to handle circular references: `"null"`, `"omit"`, `"throw"`, `"keep"`. |
| `onLimitExceeded` | `"truncate"`                                | How to handle exceeded limits: `"truncate"`, `"throw"`.                     |
| `allowFunctions`  | `false`                                     | Allow function values (otherwise removed/throws).                           |
| `allowBigint`     | `false`                                     | Allow bigint values (otherwise removed/throws).                             |
| `allowSymbols`    | `false`                                     | Allow symbol values (otherwise removed/throws).                             |
| `dangerousKeys`   | `["__proto__", "constructor", "prototype"]` | Keys to strip from every object.                                            |

## License

The source code is licensed under MIT.
This project follows the [REUSE specification](https://reuse.software) for license declaration.
Authored by Erik Michelson, 2026.
