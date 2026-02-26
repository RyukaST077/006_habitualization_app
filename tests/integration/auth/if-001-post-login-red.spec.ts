import { describe, expect, it } from "vitest";

import { IF001_RED_CASES } from "./fixtures/if-001-cases";
import { createIf001TestHarness } from "./helpers/if-001-test-harness";

const harness = createIf001TestHarness();

describe("T-033 PR-002 M-001 resolvePostLogin(userId) red tests", () => {
  it("同意済みユーザーは SCR-002 へ遷移し LOGIN_SUCCESS を扱う", async () => {
    const resolvePostLogin = harness.createPostLoginResolver(["user-consented"]);
    const route = await resolvePostLogin("user-consented");

    harness.assertPostLoginRouteDecision(route, "SCR-002");

    const callbackCase = IF001_RED_CASES.find((entry) => entry.boundary === "M-001");
    expect(callbackCase?.expected.auditAction).toBe("LOGIN_SUCCESS");
  });

  it("未同意ユーザーは SCR-008 へ遷移する", async () => {
    const resolvePostLogin = harness.createPostLoginResolver(["user-consented"]);
    const route = await resolvePostLogin("user-not-consented");

    harness.assertPostLoginRouteDecision(route, "SCR-008");
  });

  it("resolvePostLogin(userId) の期待分岐 SCR-008/SCR-002 を固定する", async () => {
    const resolvePostLogin = harness.createPostLoginResolver(["user-a"]);
    const routeSet = new Set([
      await resolvePostLogin("user-a"),
      await resolvePostLogin("user-b"),
    ]);

    expect(routeSet.has("SCR-002")).toBe(true);
    expect(routeSet.has("SCR-008")).toBe(true);
  });

  it("red: T-034 未実装のため post-login 分岐は失敗させる", () => {
    expect(harness.getT034ImplementationState()).toBe("implemented");
  });
});
