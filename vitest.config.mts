import { defineConfig } from "vitest/config";

// Unit tests check the app's functions on their own, with no browser.
// tsconfigPaths lets tests import with "@/" like the app does
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
