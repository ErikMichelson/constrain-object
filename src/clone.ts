// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

const isPlainObject = (value: object): boolean => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

export const cloneInput = (value: unknown, seen: Map<object, unknown> = new Map()): unknown => {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (seen.has(value as object)) {
    return seen.get(value as object);
  }
  if (Array.isArray(value)) {
    const out: unknown[] = Array.from({ length: value.length });
    seen.set(value, out);
    for (let i = 0; i < value.length; i++) {
      out[i] = cloneInput(value[i], seen);
    }
    return out;
  }
  if (!isPlainObject(value)) {
    return value;
  }
  const out: Record<string | symbol, unknown> = Object.create(null);
  seen.set(value, out);
  for (const key of Object.getOwnPropertyNames(value) as string[]) {
    out[key] = cloneInput((value as Record<string, unknown>)[key], seen);
  }
  for (const sym of Object.getOwnPropertySymbols(value)) {
    out[sym] = cloneInput((value as Record<symbol, unknown>)[sym], seen);
  }
  return out;
};
