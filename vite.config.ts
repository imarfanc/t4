import { defineConfig } from "vite-plus";

/**
 * Vite+ entry config. Tasks live in package.json — run `vp run choose` for the
 * grouped searchable menu, or `vp run <name>` for a specific script.
 *
 * Built-in quality tools (no package.json script needed):
 *   vp fmt    vp lint    vp check
 */
export default defineConfig({
  // These are function-expression snippets consumed by ego-browser, not
  // standalone JavaScript programs, so Oxc should not parse them directly.
  fmt: {
    ignorePatterns: ["**/browser-tools/**"],
  },
  lint: {
    ignorePatterns: ["**/browser-tools/**"],
  },
});
