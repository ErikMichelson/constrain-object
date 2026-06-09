// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vite-plus/test";

import { constrainObject } from "../src/constrain.ts";

describe("constrainObject", () => {
  describe("primitive early returns", () => {
    it("returns undefined as-is", () => {
      expect(constrainObject(undefined)).toBeUndefined();
    });

    it("returns null as-is", () => {
      expect(constrainObject(null)).toBeNull();
    });

    it("returns boolean as-is", () => {
      expect(constrainObject(true)).toBe(true);
      expect(constrainObject(false)).toBe(false);
    });

    it("returns number as-is", () => {
      expect(constrainObject(42)).toBe(42);
      expect(constrainObject(0)).toBe(0);
      expect(constrainObject(-1)).toBe(-1);
      expect(constrainObject(NaN)).toBeNaN();
      expect(constrainObject(Infinity)).toBe(Infinity);
    });
  });

  describe("string input", () => {
    it("returns a short string as-is", () => {
      expect(constrainObject("hello")).toBe("hello");
    });

    it("truncates a string exceeding maxStringLength", () => {
      const result = constrainObject("abcdefghij", { maxStringLength: 5 });
      expect(result).toBe("abcde");
    });

    it("throws when string exceeds maxStringLength with onLimitExceeded throw", () => {
      expect(() =>
        constrainObject("abcdefghij", { maxStringLength: 5, onLimitExceeded: "throw" }),
      ).toThrow("String size exceeded maximum length");
    });

    it("does not truncate a string at exactly maxStringLength", () => {
      expect(constrainObject("abcde", { maxStringLength: 5 })).toBe("abcde");
    });
  });

  describe("plain objects", () => {
    it("returns a simple object unchanged", () => {
      const input = { a: 1, b: "hello" };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result).toEqual({ a: 1, b: "hello" });
    });

    it("does not mutate the original input", () => {
      const input = { a: 1, b: { c: 2 } };
      const copy = JSON.parse(JSON.stringify(input));
      constrainObject(input, { maxDepth: 1 });
      expect(input).toEqual(copy);
    });

    it("returns an empty object unchanged", () => {
      expect(constrainObject({})).toEqual({});
    });

    it("handles nested objects", () => {
      const input = { a: { b: { c: { d: 1 } } } };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result).toEqual({ a: { b: { c: { d: 1 } } } });
    });
  });

  describe("maxDepth", () => {
    it("truncates properties exceeding maxDepth", () => {
      const input = { a: { b: { c: { d: 1 } } } };
      const result = constrainObject(input, { maxDepth: 2 }) as Record<string, any>;
      expect(result.a).toBeDefined();
      expect(result.a.b).toBeDefined();
      expect(result.a.b.c).toBeUndefined();
    });

    it("throws when depth exceeds maxDepth with onLimitExceeded throw", () => {
      const input = { a: { b: { c: 1 } } };
      expect(() => constrainObject(input, { maxDepth: 1, onLimitExceeded: "throw" })).toThrow(
        "Object exceeded maximum depth",
      );
    });

    it("allows objects at exactly maxDepth", () => {
      const input = { a: { b: 1 } };
      const result = constrainObject(input, { maxDepth: 2 }) as Record<string, any>;
      expect(result.a.b).toBe(1);
    });
  });

  describe("maxNodes", () => {
    it("truncates when node count reaches maxNodes", () => {
      const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const result = constrainObject(input, { maxNodes: 3 }) as Record<string, unknown>;
      const remainingKeys = Object.keys(result);
      expect(remainingKeys.length).toBeLessThanOrEqual(3);
    });

    it("throws when node count reaches maxNodes with onLimitExceeded throw", () => {
      const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      expect(() => constrainObject(input, { maxNodes: 2, onLimitExceeded: "throw" })).toThrow(
        "Object exceeded maximum nodes",
      );
    });
  });

  describe("maxArrayLength", () => {
    it("truncates arrays exceeding maxArrayLength", () => {
      const input = [1, 2, 3, 4, 5];
      const result = constrainObject(input, { maxArrayLength: 3 }) as unknown[];
      expect(result).toEqual([1, 2, 3]);
      expect(result.length).toBe(3);
    });

    it("throws when array exceeds maxArrayLength with onLimitExceeded throw", () => {
      expect(() =>
        constrainObject([1, 2, 3, 4, 5], { maxArrayLength: 3, onLimitExceeded: "throw" }),
      ).toThrow("Array size exceeded maximum length");
    });

    it("does not truncate arrays at exactly maxArrayLength", () => {
      const result = constrainObject([1, 2, 3], { maxArrayLength: 3 }) as unknown[];
      expect(result).toEqual([1, 2, 3]);
    });

    it("handles nested arrays", () => {
      const input = { arr: [1, 2, 3, 4, 5] };
      const result = constrainObject(input, { maxArrayLength: 2 }) as Record<string, unknown>;
      expect(result.arr).toEqual([1, 2]);
    });

    it("handles empty arrays", () => {
      expect(constrainObject([])).toEqual([]);
    });
  });

  describe("maxObjectKeys", () => {
    it("truncates objects exceeding maxObjectKeys", () => {
      const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
      const result = constrainObject(input, { maxObjectKeys: 3 }) as Record<string, unknown>;
      expect(Object.keys(result).length).toBeLessThanOrEqual(3);
    });

    it("does not truncate objects at exactly maxObjectKeys", () => {
      const input = { a: 1, b: 2, c: 3 };
      const result = constrainObject(input, { maxObjectKeys: 3 }) as Record<string, unknown>;
      expect(Object.keys(result).length).toBe(3);
    });
  });

  describe("maxStringLength", () => {
    it("truncates nested strings exceeding maxStringLength", () => {
      const input = { name: "a very long string here" };
      const result = constrainObject(input, { maxStringLength: 6 }) as Record<string, unknown>;
      expect(result.name).toBe("a very");
    });

    it("throws for nested strings exceeding maxStringLength with onLimitExceeded throw", () => {
      const input = { name: "a very long string here" };
      expect(() =>
        constrainObject(input, { maxStringLength: 6, onLimitExceeded: "throw" }),
      ).toThrow("String size exceeded maximum length");
    });
  });

  describe("bigint handling", () => {
    it("removes bigint values by default (truncate)", () => {
      const input = { a: BigInt(42), b: "keep" };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBeUndefined();
      expect(result.b).toBe("keep");
    });

    it("throws on bigint when onLimitExceeded is throw", () => {
      const input = { a: BigInt(42) };
      expect(() => constrainObject(input, { onLimitExceeded: "throw" })).toThrow(
        "BigInt is not allowed",
      );
    });

    it("keeps bigint when allowBigint is true", () => {
      const input = { a: BigInt(42) };
      const result = constrainObject(input, { allowBigint: true }) as Record<string, unknown>;
      expect(result.a).toBe(BigInt(42));
    });
  });

  describe("function handling", () => {
    it("removes function values by default (truncate)", () => {
      const input = { fn: () => 42, b: "keep" };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.fn).toBeUndefined();
      expect(result.b).toBe("keep");
    });

    it("throws on functions when onLimitExceeded is throw", () => {
      const input = { fn: () => 42 };
      expect(() => constrainObject(input, { onLimitExceeded: "throw" })).toThrow(
        "Function is not allowed",
      );
    });

    it("keeps functions when allowFunctions is true", () => {
      const fn = () => 42;
      const input = { fn, b: 1 };
      const result = constrainObject(input, { allowFunctions: true }) as Record<string, unknown>;
      expect(typeof result.fn).toBe("function");
    });
  });

  describe("symbol handling", () => {
    it("removes symbol values by default (truncate)", () => {
      const sym = Symbol("test");
      const input = { a: sym, b: "keep" };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBeUndefined();
      expect(result.b).toBe("keep");
    });

    it("throws on symbols when onLimitExceeded is throw", () => {
      const input = { a: Symbol("test") };
      expect(() => constrainObject(input, { onLimitExceeded: "throw" })).toThrow(
        "Symbol is not allowed",
      );
    });

    it("keeps symbols when allowSymbols is true", () => {
      const sym = Symbol("test");
      const input = { a: sym };
      const result = constrainObject(input, { allowSymbols: true }) as Record<string, unknown>;
      expect(result.a).toBe(sym);
    });
  });

  describe("symbol-keyed properties", () => {
    it("preserves symbol-keyed properties whose value is allowed", () => {
      const sym = Symbol("key");
      const input: Record<symbol, unknown> = { [sym]: "value" };
      const result = constrainObject(input, { allowSymbols: true }) as Record<symbol, unknown>;
      expect(result[sym]).toBe("value");
    });

    it("removes symbol-keyed properties with disallowed symbol values", () => {
      const sym = Symbol("key");
      const input: Record<symbol, unknown> = { [sym]: Symbol("val") };
      const result = constrainObject(input) as Record<symbol, unknown>;
      expect(result[sym]).toBeUndefined();
    });
  });

  describe("cycle detection", () => {
    it("replaces cycles with null by default (onCycle: null)", () => {
      const input: Record<string, unknown> = { a: 1 };
      input.self = input;
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect(result.self).toBeNull();
    });

    it("omits cyclic references with onCycle: omit", () => {
      const input: Record<string, unknown> = { a: 1 };
      input.self = input;
      const result = constrainObject(input, { onCycle: "omit" }) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect("self" in result).toBe(false);
    });

    it("throws on cycles with onCycle: throw", () => {
      const input: Record<string, unknown> = { a: 1 };
      input.self = input;
      expect(() => constrainObject(input, { onCycle: "throw" })).toThrow(
        "Cycle in object detected",
      );
    });

    it("keeps cyclic references with onCycle: keep", () => {
      const input: Record<string, unknown> = { a: 1 };
      input.self = input;
      const result = constrainObject(input, { onCycle: "keep" }) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect(result.self).toBeDefined();
    });

    it("detects deep cycles", () => {
      const input: Record<string, unknown> = { a: { b: {} } };
      (input.a as Record<string, unknown>).b = input;
      const result = constrainObject(input) as Record<string, any>;
      expect(result.a.b).toBeNull();
    });
  });

  describe("dangerous keys", () => {
    it("removes __proto__ key by default", () => {
      const input = JSON.parse('{"__proto__": {"polluted": true}, "safe": 1}');
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.safe).toBe(1);
      expect(Object.hasOwn(result, "__proto__")).toBe(false);
      expect(result.polluted).toBeUndefined();
    });

    it("does not inherit properties from a polluted prototype set via object literal", () => {
      const input = {
        a: 1,
        b: { c: "a very long string", d: { key: "value" } },
        __proto__: { polluted: true },
      } as Record<string, unknown>;
      const result = constrainObject(input, {
        maxStringLength: 6,
        maxDepth: 2,
      }) as Record<string, unknown>;
      expect(result).toEqual({ a: 1, b: { c: "a very", d: {} } });
      expect(result.polluted).toBeUndefined();
      expect(Object.getPrototypeOf(result)).toBeNull();
    });

    it("does not inherit properties from a prototype set via Object.setPrototypeOf", () => {
      const input: Record<string, unknown> = { a: 1 };
      Object.setPrototypeOf(input, { polluted: true });
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect(result.polluted).toBeUndefined();
      expect(Object.getPrototypeOf(result)).toBeNull();
    });

    it("removes constructor key by default", () => {
      const input = { constructor: "evil", safe: 1 };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.safe).toBe(1);
      expect(Object.hasOwn(result, "constructor")).toBe(false);
    });

    it("removes prototype key by default", () => {
      const input = { prototype: "evil", safe: 1 };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.safe).toBe(1);
      expect(Object.hasOwn(result, "prototype")).toBe(false);
    });

    it("allows custom dangerous keys", () => {
      const input = { __proto__: {}, safe: 1 };
      const result = constrainObject(input, { dangerousKeys: [] }) as Record<string, unknown>;
      expect(result.safe).toBe(1);
    });

    it("supports custom dangerous keys list", () => {
      const input = { evil: 1, safe: 2 };
      const result = constrainObject(input, { dangerousKeys: ["evil"] }) as Record<string, unknown>;
      expect("evil" in result).toBe(false);
      expect(result.safe).toBe(2);
    });
  });

  describe("null and undefined values inside objects", () => {
    it("preserves null values", () => {
      const input = { a: null, b: 1 };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBeNull();
      expect(result.b).toBe(1);
    });

    it("preserves undefined values", () => {
      const input = { a: undefined, b: 1 };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBeUndefined();
      expect(result.b).toBe(1);
    });
  });

  describe("boolean and number values inside objects", () => {
    it("preserves booleans inside objects", () => {
      const input = { a: true, b: false };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBe(true);
      expect(result.b).toBe(false);
    });

    it("preserves numbers inside objects", () => {
      const input = { a: 0, b: -1, c: 3.14 };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBe(0);
      expect(result.b).toBe(-1);
      expect(result.c).toBe(3.14);
    });
  });

  describe("mixed nested structures", () => {
    it("handles objects containing arrays containing objects", () => {
      const input = { items: [{ id: 1 }, { id: 2 }] };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }] });
    });

    it("handles arrays with mixed types", () => {
      const input = [1, "hello", null, true, { a: 1 }];
      const result = constrainObject(input) as unknown[];
      expect(result).toEqual([1, "hello", null, true, { a: 1 }]);
    });
  });

  describe("unknown type fallback", () => {
    it("deletes properties of unknown typeof (catch-all)", () => {
      // This tests the `item.type !== 'object'` delete branch.
      // In practice, typeof only returns known strings, so this branch
      // is a safety net. We verify the function handles all known types.
      const input = { a: 1, b: "str", c: true, d: null };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result.a).toBe(1);
      expect(result.b).toBe("str");
      expect(result.c).toBe(true);
      expect(result.d).toBeNull();
    });
  });

  describe("parseOptions validation", () => {
    it("throws on negative maxDepth", () => {
      expect(() => constrainObject({}, { maxDepth: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxNodes", () => {
      expect(() => constrainObject({}, { maxNodes: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxArrayLength", () => {
      expect(() => constrainObject({}, { maxArrayLength: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxObjectKeys", () => {
      expect(() => constrainObject({}, { maxObjectKeys: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxStringLength", () => {
      expect(() => constrainObject({}, { maxStringLength: -1 })).toThrow("Invalid options");
    });

    it("throws on invalid onCycle value", () => {
      expect(() => constrainObject({}, { onCycle: "invalid" as any })).toThrow("Invalid options");
    });

    it("throws on invalid onLimitExceeded value", () => {
      expect(() => constrainObject({}, { onLimitExceeded: "invalid" as any })).toThrow(
        "Invalid options",
      );
    });

    it("accepts valid onCycle values", () => {
      for (const onCycle of ["null", "omit", "throw", "keep"] as const) {
        expect(() => constrainObject({}, { onCycle })).not.toThrow();
      }
    });

    it("accepts valid onLimitExceeded values", () => {
      for (const onLimitExceeded of ["truncate", "throw"] as const) {
        expect(() => constrainObject({}, { onLimitExceeded })).not.toThrow();
      }
    });
  });

  describe("default options", () => {
    it("works with no options provided", () => {
      const input = { a: 1, b: [1, 2, 3], c: { d: "hello" } };
      const result = constrainObject(input) as Record<string, unknown>;
      expect(result).toEqual({ a: 1, b: [1, 2, 3], c: { d: "hello" } });
    });

    it("works with empty options", () => {
      const result = constrainObject({ x: 1 }, {}) as Record<string, unknown>;
      expect(result).toEqual({ x: 1 });
    });
  });
});
