import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  bundle: true,
  skipNodeModulesBundle: true,
  splitting: true,
  clean: true,
});
