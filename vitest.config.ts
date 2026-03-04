import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);
  const reportsDirectory = process.env.VITEST_COVERAGE_DIR ?? "coverage/v8";

  return {
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
      exclude: ["tests/e2e/**"],
      environment: "node",
      globals: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        reportsDirectory,
        clean: false
      }
    }
  };
});
