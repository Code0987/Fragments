import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative asset URLs so one build works locally and at /fragments/ on Pages.
  base: "./",
  test: {
    include: ["src/**/*.test.ts"],
  },
});
