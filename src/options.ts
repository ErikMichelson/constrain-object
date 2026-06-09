// SPDX-FileCopyrightText: 2026 Erik Michelson
// SPDX-License-Identifier: MIT

export interface SanitizeOptions {
  maxDepth?: number;
  maxNodes?: number;
  maxArrayLength?: number;
  maxObjectKeys?: number;
  maxStringLength?: number;
  onCycle?: "null" | "omit" | "throw" | "keep";
  onLimitExceeded?: "truncate" | "throw";
  allowFunctions?: boolean;
  allowBigint?: boolean;
  allowSymbols?: boolean;
  dangerousKeys?: string[];
}

interface _SanitizeOptionsMerged extends Omit<Required<SanitizeOptions>, "dangerousKeys"> {
  dangerousKeys: Set<string>;
}

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  maxDepth: 20,
  maxNodes: 10_000,
  maxArrayLength: 1_000,
  maxObjectKeys: 1_000,
  maxStringLength: 10_000,
  onCycle: "null",
  onLimitExceeded: "truncate",
  allowFunctions: false,
  allowBigint: false,
  allowSymbols: false,
  dangerousKeys: ["__proto__", "constructor", "prototype"],
};

export const parseOptions = (options: SanitizeOptions): _SanitizeOptionsMerged => {
  const merged: Required<SanitizeOptions> = { ...DEFAULT_OPTIONS, ...options };
  if (
    merged.maxDepth < 0 ||
    merged.maxNodes < 0 ||
    merged.maxArrayLength < 0 ||
    merged.maxObjectKeys < 0 ||
    merged.maxStringLength < 0 ||
    !["null", "omit", "throw", "keep"].includes(merged.onCycle) ||
    !["truncate", "throw"].includes(merged.onLimitExceeded) ||
    !Array.isArray(merged.dangerousKeys)
  ) {
    throw new Error("Invalid options provided to constrainObject");
  }
  const dangerousKeysSet = new Set(merged.dangerousKeys);
  return {
    ...merged,
    dangerousKeys: dangerousKeysSet,
  };
};
