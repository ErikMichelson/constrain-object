// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vite-plus/test";

import { cloneInput } from "../src/clone.ts";

describe("cloneInput", () => {
  describe("primitives", () => {
    it("returns undefined as-is", () => {
      expect(cloneInput(undefined)).toBeUndefined();
    });

    it("returns null as-is", () => {
      expect(cloneInput(null)).toBeNull();
    });

    it("returns booleans as-is", () => {
      expect(cloneInput(true)).toBe(true);
      expect(cloneInput(false)).toBe(false);
    });

    it("returns numbers as-is", () => {
      expect(cloneInput(0)).toBe(0);
      expect(cloneInput(42)).toBe(42);
      expect(cloneInput(-1)).toBe(-1);
      expect(cloneInput(3.14)).toBe(3.14);
      expect(cloneInput(Number.NaN)).toBeNaN();
      expect(cloneInput(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY);
    });

    it("returns strings as-is", () => {
      expect(cloneInput("")).toBe("");
      expect(cloneInput("hello")).toBe("hello");
    });

    it("returns symbols as-is", () => {
      const sym = Symbol("x");
      expect(cloneInput(sym)).toBe(sym);
    });

    it("returns bigints as-is", () => {
      const big = BigInt("9007199254740993");
      expect(cloneInput(big)).toBe(big);
    });
  });

  describe("plain objects", () => {
    it("clones a flat object", () => {
      const input = { a: 1, b: "x", c: true, d: null };
      const out = cloneInput(input) as Record<string, unknown>;
      expect(out).toEqual(input);
      expect(out).not.toBe(input);
    });

    it("clones nested objects", () => {
      const input = { a: { b: { c: 1 } } };
      const out = cloneInput(input) as Record<string, Record<string, Record<string, number>>>;
      expect(out).toEqual(input);
      expect(out.a).not.toBe(input.a);
      expect(out.a.b).not.toBe(input.a.b);
    });

    it("clones an empty object", () => {
      const out = cloneInput({});
      expect(out).toEqual({});
    });

    it("uses a null prototype on the cloned object", () => {
      const out = cloneInput({ a: 1 }) as Record<string, unknown>;
      expect(Object.getPrototypeOf(out)).toBeNull();
    });
  });

  describe("arrays", () => {
    it("clones a flat array", () => {
      const input = [1, 2, 3];
      const out = cloneInput(input) as unknown[];
      expect(out).toEqual(input);
      expect(out).not.toBe(input);
    });

    it("clones nested arrays", () => {
      const input = [
        [1, 2],
        [3, 4],
      ];
      const out = cloneInput(input) as number[][];
      expect(out).toEqual(input);
      expect(out[0]).not.toBe(input[0]);
    });

    it("clones an empty array", () => {
      const out = cloneInput([]);
      expect(out).toEqual([]);
    });

    it("preserves array length when cloning", () => {
      const out = cloneInput([1, 2, 3, 4, 5]) as unknown[];
      expect(out.length).toBe(5);
    });
  });

  describe("prototype pollution defense", () => {
    it("does not carry a polluted prototype set via object literal __proto__", () => {
      const input = {
        a: 1,
        b: { c: "value" },
        __proto__: { polluted: true },
      } as Record<string, unknown>;
      const out = cloneInput(input) as Record<string, unknown>;
      expect(Object.getPrototypeOf(out)).toBeNull();
      expect(out.polluted).toBeUndefined();
      expect(Object.keys(out)).toEqual(["a", "b"]);
    });

    it("does not carry a polluted prototype set via Object.setPrototypeOf", () => {
      const input: Record<string, unknown> = { a: 1 };
      Object.setPrototypeOf(input, { polluted: true });
      const out = cloneInput(input) as Record<string, unknown>;
      expect(Object.getPrototypeOf(out)).toBeNull();
      expect(out.polluted).toBeUndefined();
      expect(Object.keys(out)).toEqual(["a"]);
    });

    it("does not carry a polluted prototype set on a nested object", () => {
      const nested = { x: 1 };
      Object.setPrototypeOf(nested, { polluted: true });
      const input = { outer: nested };
      const out = cloneInput(input) as { outer: Record<string, unknown> };
      expect(Object.getPrototypeOf(out.outer)).toBeNull();
      expect(out.outer.polluted).toBeUndefined();
      expect(out.outer.x).toBe(1);
    });

    it("does not carry a polluted prototype set via JSON.parse __proto__", () => {
      const input = JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}');
      const out = cloneInput(input) as Record<string, unknown>;
      expect(out.polluted).toBeUndefined();
      expect(out.safe).toBe(1);
      expect(Object.getPrototypeOf(out)).toBeNull();
    });

    it("strips inherited properties from the input prototype", () => {
      const input: Record<string, unknown> = { a: 1 };
      Object.setPrototypeOf(input, { polluted: true, another: "x" });
      const out = cloneInput(input) as Record<string, unknown>;
      expect(out.polluted).toBeUndefined();
      expect(out.another).toBeUndefined();
    });
  });

  describe("symbol-keyed properties", () => {
    it("preserves symbol-keyed properties", () => {
      const sym = Symbol("key");
      const input: Record<symbol, unknown> = { [sym]: "value" };
      const out = cloneInput(input) as Record<symbol, unknown>;
      expect(out[sym]).toBe("value");
    });

    it("preserves symbol-keyed properties with object values", () => {
      const sym = Symbol("key");
      const input: Record<symbol, unknown> = { [sym]: { nested: 1 } };
      const out = cloneInput(input) as Record<symbol, Record<string, number>>;
      expect(out[sym]).toEqual({ nested: 1 });
      expect(out[sym]).not.toBe(input[sym]);
    });
  });

  describe("cycle handling", () => {
    it("handles a self-referencing object without infinite recursion", () => {
      const input: Record<string, unknown> = { a: 1 };
      input.self = input;
      const out = cloneInput(input) as Record<string, unknown>;
      expect(out.a).toBe(1);
      expect(out.self).toBe(out);
    });

    it("handles mutually-referencing objects without infinite recursion", () => {
      const a: Record<string, unknown> = { name: "a" };
      const b: Record<string, unknown> = { name: "b", ref: a };
      a.ref = b;
      const out = cloneInput(a) as Record<string, unknown>;
      expect(out.name).toBe("a");
      const outB = out.ref as Record<string, unknown>;
      expect(outB.name).toBe("b");
      expect(outB.ref).toBe(out);
    });

    it("handles cycles inside arrays", () => {
      const input: { items: unknown[] } = { items: [] };
      input.items.push(input);
      const out = cloneInput(input) as { items: unknown[] };
      expect(out.items[0]).toBe(out);
    });

    it("preserves the same shared reference across two paths", () => {
      const shared = { x: 1 };
      const input = { a: shared, b: shared };
      const out = cloneInput(input) as { a: Record<string, number>; b: Record<string, number> };
      expect(out.a).toBe(out.b);
      expect(out.a).not.toBe(shared);
    });
  });

  describe("non-plain objects", () => {
    it("passes Date instances through by reference", () => {
      const d = new Date(2024, 0, 1);
      const out = cloneInput(d);
      expect(out).toBe(d);
    });

    it("passes RegExp instances through by reference", () => {
      const re = /foo/g;
      const out = cloneInput(re);
      expect(out).toBe(re);
    });

    it("passes Map instances through by reference", () => {
      const m = new Map<string, number>([["a", 1]]);
      const out = cloneInput(m);
      expect(out).toBe(m);
    });

    it("passes Set instances through by reference", () => {
      const s = new Set<number>([1, 2, 3]);
      const out = cloneInput(s);
      expect(out).toBe(s);
    });

    it("does not enumerate internal slots of built-in objects as own properties", () => {
      const m = new Map<string, number>([["a", 1]]);
      const input = { m };
      const out = cloneInput(input) as { m: Map<string, number> };
      expect(out.m).toBe(m);
    });
  });

  describe("does not mutate the input", () => {
    it("does not mutate the input object", () => {
      const input = { a: 1, b: { c: 2 } };
      const snapshot = JSON.parse(JSON.stringify(input));
      cloneInput(input);
      expect(input).toEqual(snapshot);
    });

    it("does not mutate nested input objects", () => {
      const nested = { c: 2 };
      const input = { a: 1, b: nested };
      const snapshot = JSON.parse(JSON.stringify(nested));
      cloneInput(input);
      expect(nested).toEqual(snapshot);
    });

    it("does not mutate the input array", () => {
      const input = [1, 2, { x: 1 }];
      const snapshot = JSON.parse(JSON.stringify(input));
      cloneInput(input);
      expect(input).toEqual(snapshot);
    });
  });

  describe("mixed structures", () => {
    it("clones objects containing arrays containing objects", () => {
      const input = { items: [{ id: 1 }, { id: 2 }] };
      const out = cloneInput(input) as { items: Array<{ id: number }> };
      expect(out).toEqual(input);
      expect(out.items[0]).not.toBe(input.items[0]);
    });

    it("clones arrays of mixed primitive types", () => {
      const input = [1, "hello", null, true, false, undefined];
      const out = cloneInput(input) as unknown[];
      expect(out).toEqual(input);
    });

    it("clones deeply nested mixed structures", () => {
      const input = {
        a: 1,
        b: [1, 2, { c: [3, 4, { d: 5 }] }],
      };
      const out = cloneInput(input) as typeof input;
      expect(out).toEqual(input);
    });
  });

  describe("output is a structural deep copy", () => {
    it("mutating the clone does not affect the original", () => {
      const input = { a: { b: 1 } };
      const out = cloneInput(input) as { a: { b: number } };
      out.a.b = 999;
      expect(input.a.b).toBe(1);
    });

    it("mutating the original does not affect the clone", () => {
      const input = { a: { b: 1 } };
      const out = cloneInput(input) as { a: { b: number } };
      input.a.b = 999;
      expect(out.a.b).toBe(1);
    });
  });
});
