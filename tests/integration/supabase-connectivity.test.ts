import { describe, expect, it } from "vitest";

import { validateSupabaseTestEnv } from "../helpers/env-guard";
import { TEST_FIXTURE_USERS } from "../helpers/fixtures";

describe("supabase connectivity guard", () => {
  it("validates environment and fixture consistency", () => {
    const env = validateSupabaseTestEnv(process.env);

    expect(env.supabaseEnv.length).toBeGreaterThan(0);
    expect(env.supabaseUrl.startsWith("http")).toBe(true);
    expect(env.supabaseAnonKey.length).toBeGreaterThan(0);

    expect(TEST_FIXTURE_USERS.USER_A.key).toBe("USER-A");
    expect(TEST_FIXTURE_USERS.USER_B.key).toBe("USER-B");
    expect(TEST_FIXTURE_USERS.OPS_1.role).toBe("ROLE-002");
  });
});
