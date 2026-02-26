import { describe, expect, it } from "vitest";

import { createIf001TestHarness } from "./helpers/if-001-test-harness";

const harness = createIf001TestHarness();

describe("T-033 PR-002 SCR-001 consent decline logout red tests", () => {
  it("同意拒否時はセッション破棄後に SCR-001 へ戻す", async () => {
    const logout = harness.createConsentDeclineLogoutStub();
    const result = await logout("user-declined");

    harness.assertConsentDeclineLogout(result);
  });

  it("同意拒否時の監査イベントを LOGIN_FAILED として固定する", async () => {
    const logout = harness.createConsentDeclineLogoutStub();
    const result = await logout("user-declined");

    expect(result.auditAction).toBe("LOGIN_FAILED");
    expect(result.route).toBe("SCR-001");
  });

  it("red: T-034 未実装のため logout 導線は失敗させる", () => {
    expect(harness.getT034ImplementationState()).toBe("implemented");
  });
});
