import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
    },
  },
  pack: [
    {
      dts: {
        tsgo: true,
      },
      exports: true,
      clean: true,
      format: ["esm", "cjs"],
    },
    {
      format: ["iife"],
      platform: "browser",
      globalName: "ConstrainObject",
      minify: true,
    },
  ],
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    semi: true,
    tabWidth: 2,
    sortImports: true,
    trailingComma: "all",
  },
});
