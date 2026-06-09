// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

import { describe, expect, it } from "vite-plus/test";

import { parseOptions } from "../src/options.ts";

describe("parseOptions", () => {
  describe("default values", () => {
    it("returns all defaults when given an empty object", () => {
      const opts = parseOptions({});
      expect(opts.maxDepth).toBe(20);
      expect(opts.maxNodes).toBe(10_000);
      expect(opts.maxArrayLength).toBe(1_000);
      expect(opts.maxObjectKeys).toBe(1_000);
      expect(opts.maxStringLength).toBe(10_000);
      expect(opts.onCycle).toBe("null");
      expect(opts.onLimitExceeded).toBe("truncate");
      expect(opts.allowFunctions).toBe(false);
      expect(opts.allowBigint).toBe(false);
      expect(opts.allowSymbols).toBe(false);
    });

    it("converts dangerousKeys to a Set with default entries", () => {
      const opts = parseOptions({});
      expect(opts.dangerousKeys).toBeInstanceOf(Set);
      expect(opts.dangerousKeys.has("__proto__")).toBe(true);
      expect(opts.dangerousKeys.has("constructor")).toBe(true);
      expect(opts.dangerousKeys.has("prototype")).toBe(true);
    });
  });

  describe("overriding options", () => {
    it("overrides maxDepth", () => {
      expect(parseOptions({ maxDepth: 5 }).maxDepth).toBe(5);
    });

    it("overrides maxNodes", () => {
      expect(parseOptions({ maxNodes: 100 }).maxNodes).toBe(100);
    });

    it("overrides maxArrayLength", () => {
      expect(parseOptions({ maxArrayLength: 50 }).maxArrayLength).toBe(50);
    });

    it("overrides maxObjectKeys", () => {
      expect(parseOptions({ maxObjectKeys: 10 }).maxObjectKeys).toBe(10);
    });

    it("overrides maxStringLength", () => {
      expect(parseOptions({ maxStringLength: 500 }).maxStringLength).toBe(500);
    });

    it("overrides onCycle", () => {
      expect(parseOptions({ onCycle: "keep" }).onCycle).toBe("keep");
    });

    it("overrides onLimitExceeded", () => {
      expect(parseOptions({ onLimitExceeded: "throw" }).onLimitExceeded).toBe("throw");
    });

    it("overrides allowFunctions", () => {
      expect(parseOptions({ allowFunctions: true }).allowFunctions).toBe(true);
    });

    it("overrides allowBigint", () => {
      expect(parseOptions({ allowBigint: true }).allowBigint).toBe(true);
    });

    it("overrides allowSymbols", () => {
      expect(parseOptions({ allowSymbols: true }).allowSymbols).toBe(true);
    });

    it("overrides dangerousKeys and converts to Set", () => {
      const opts = parseOptions({ dangerousKeys: ["a", "b"] });
      expect(opts.dangerousKeys).toBeInstanceOf(Set);
      expect(opts.dangerousKeys.has("a")).toBe(true);
      expect(opts.dangerousKeys.has("b")).toBe(true);
      expect(opts.dangerousKeys.has("__proto__")).toBe(false);
    });

    it("allows empty dangerousKeys array", () => {
      const opts = parseOptions({ dangerousKeys: [] });
      expect(opts.dangerousKeys.size).toBe(0);
    });
  });

  describe("partial overrides leave other defaults intact", () => {
    it("only overrides maxDepth, keeps others", () => {
      const opts = parseOptions({ maxDepth: 1 });
      expect(opts.maxDepth).toBe(1);
      expect(opts.maxNodes).toBe(10_000);
      expect(opts.maxArrayLength).toBe(1_000);
      expect(opts.onCycle).toBe("null");
      expect(opts.onLimitExceeded).toBe("truncate");
    });

    it("only overrides onCycle, keeps others", () => {
      const opts = parseOptions({ onCycle: "throw" });
      expect(opts.onCycle).toBe("throw");
      expect(opts.onLimitExceeded).toBe("truncate");
      expect(opts.allowFunctions).toBe(false);
    });
  });

  describe("boundary values", () => {
    it("accepts maxDepth of 0", () => {
      expect(parseOptions({ maxDepth: 0 }).maxDepth).toBe(0);
    });

    it("accepts maxNodes of 0", () => {
      expect(parseOptions({ maxNodes: 0 }).maxNodes).toBe(0);
    });

    it("accepts maxArrayLength of 0", () => {
      expect(parseOptions({ maxArrayLength: 0 }).maxArrayLength).toBe(0);
    });

    it("accepts maxObjectKeys of 0", () => {
      expect(parseOptions({ maxObjectKeys: 0 }).maxObjectKeys).toBe(0);
    });

    it("accepts maxStringLength of 0", () => {
      expect(parseOptions({ maxStringLength: 0 }).maxStringLength).toBe(0);
    });
  });

  describe("validation errors", () => {
    it("throws on negative maxDepth", () => {
      expect(() => parseOptions({ maxDepth: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxNodes", () => {
      expect(() => parseOptions({ maxNodes: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxArrayLength", () => {
      expect(() => parseOptions({ maxArrayLength: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxObjectKeys", () => {
      expect(() => parseOptions({ maxObjectKeys: -1 })).toThrow("Invalid options");
    });

    it("throws on negative maxStringLength", () => {
      expect(() => parseOptions({ maxStringLength: -1 })).toThrow("Invalid options");
    });

    it("throws on invalid onCycle value", () => {
      expect(() => parseOptions({ onCycle: "invalid" as any })).toThrow("Invalid options");
    });

    it("throws on invalid onLimitExceeded value", () => {
      expect(() => parseOptions({ onLimitExceeded: "invalid" as any })).toThrow("Invalid options");
    });

    it("throws when dangerousKeys is not an array", () => {
      expect(() => parseOptions({ dangerousKeys: "not-an-array" as any })).toThrow(
        "Invalid options",
      );
    });

    it("throws on multiple invalid options simultaneously", () => {
      expect(() => parseOptions({ maxDepth: -1, maxNodes: -2, onCycle: "bad" as any })).toThrow(
        "Invalid options",
      );
    });
  });

  describe("valid enum values", () => {
    it.each(["null", "omit", "throw", "keep"] as const)("accepts onCycle: %s", (val) => {
      expect(() => parseOptions({ onCycle: val })).not.toThrow();
      expect(parseOptions({ onCycle: val }).onCycle).toBe(val);
    });

    it.each(["truncate", "throw"] as const)("accepts onLimitExceeded: %s", (val) => {
      expect(() => parseOptions({ onLimitExceeded: val })).not.toThrow();
      expect(parseOptions({ onLimitExceeded: val }).onLimitExceeded).toBe(val);
    });
  });
});
