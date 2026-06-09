// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

import { cloneInput } from "./clone.ts";
import { parseOptions, type SanitizeOptions } from "./options.ts";

interface _StackItem {
  depth: number;
  type: string;
  parent: Record<string | number | symbol, unknown>;
  key: string | number | symbol;
}

export function constrainObject(input: unknown, options: SanitizeOptions = {}): unknown {
  const config = parseOptions(options);
  let countNodes = 0;

  if (
    input === undefined ||
    input === null ||
    typeof input === "boolean" ||
    typeof input === "number"
  ) {
    return input;
  }

  const root = {
    root: cloneInput(input),
  };

  const stack: _StackItem[] = [
    {
      depth: 0,
      type: typeof input,
      parent: root,
      key: "root",
    },
  ];
  const seen = new WeakSet<object>();

  while (stack.length > 0) {
    const item = stack.pop();
    if (item === undefined) {
      continue;
    }

    if (item.depth > config.maxDepth) {
      if (config.onLimitExceeded === "throw") {
        throw new Error("Object exceeded maximum depth");
      } else if (config.onLimitExceeded === "truncate") {
        delete item.parent[item.key];
        continue;
      }
    }

    if (countNodes >= config.maxNodes) {
      if (config.onLimitExceeded === "throw") {
        throw new Error("Object exceeded maximum nodes");
      } else if (config.onLimitExceeded === "truncate") {
        delete item.parent[item.key];
        continue;
      }
    }

    if (
      item.parent[item.key] === null ||
      item.parent[item.key] === undefined ||
      item.type === "boolean" ||
      item.type === "number"
    ) {
      countNodes++;
      continue;
    }

    if (item.type === "string") {
      if ((item.parent[item.key] as string).length > config.maxStringLength) {
        if (config.onLimitExceeded === "throw") {
          throw new Error("String size exceeded maximum length");
        } else if (config.onLimitExceeded === "truncate") {
          item.parent[item.key] = (item.parent[item.key] as string).slice(
            0,
            config.maxStringLength,
          );
        }
      }
      countNodes++;
      continue;
    }

    if (item.type === "bigint") {
      if (!config.allowBigint) {
        if (config.onLimitExceeded === "throw") {
          throw new Error("BigInt is not allowed");
        } else if (config.onLimitExceeded === "truncate") {
          delete item.parent[item.key];
          continue;
        }
      }
      countNodes++;
      continue;
    }

    if (item.type === "function") {
      if (!config.allowFunctions) {
        if (config.onLimitExceeded === "throw") {
          throw new Error("Function is not allowed");
        } else if (config.onLimitExceeded === "truncate") {
          delete item.parent[item.key];
          continue;
        }
      }
      countNodes++;
      continue;
    }

    if (item.type === "symbol") {
      if (!config.allowSymbols) {
        if (config.onLimitExceeded === "throw") {
          throw new Error("Symbol is not allowed");
        } else if (config.onLimitExceeded === "truncate") {
          delete item.parent[item.key];
          continue;
        }
      }
      countNodes++;
      continue;
    }

    if (item.type !== "object") {
      delete item.parent[item.key];
      continue;
    }

    const value = item.parent[item.key] as object;

    if (seen.has(value)) {
      if (config.onCycle === "null") {
        item.parent[item.key] = null;
      } else if (config.onCycle === "omit") {
        delete item.parent[item.key];
      } else if (config.onCycle === "throw") {
        throw new Error("Cycle in object detected");
      } else if (config.onCycle === "keep") {
        countNodes++;
      }
      continue;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      let arrayLength = value.length;
      if (arrayLength > config.maxArrayLength) {
        if (config.onLimitExceeded === "throw") {
          throw new Error("Array size exceeded maximum length");
        } else if (config.onLimitExceeded === "truncate") {
          arrayLength = config.maxArrayLength;
          (value as unknown[]).length = arrayLength;
        }
      }
      for (let i = arrayLength - 1; i >= 0; i--) {
        stack.push({
          depth: item.depth + 1,
          type: typeof value[i],
          parent: value as unknown as Record<string | number | symbol, unknown>,
          key: i,
        });
      }
      countNodes++;
      continue;
    }

    let keys: (string | symbol)[] = [...Object.keys(value), ...Object.getOwnPropertySymbols(value)];
    if (keys.length > config.maxObjectKeys) {
      const excess = keys.slice(config.maxObjectKeys);
      keys = keys.slice(0, config.maxObjectKeys);
      for (const key of excess) {
        delete (value as Record<string | symbol, unknown>)[key];
      }
    }
    for (const key of keys) {
      if (typeof key === "string" && config.dangerousKeys.has(key)) {
        delete (value as Record<string | symbol, unknown>)[key];
        continue;
      }
      stack.push({
        depth: item.depth + 1,
        type: typeof (value as Record<string | symbol, unknown>)[key],
        parent: value as Record<string | symbol, unknown>,
        key: key,
      });
    }
  }

  return root?.root ?? undefined;
}
