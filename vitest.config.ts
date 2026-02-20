import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    test: {
      include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
      exclude: ["tests/e2e/**"],
      environment: "node",
      globals: true,
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov"],
        reportsDirectory: "coverage/v8"
      }
    }
  };
});
