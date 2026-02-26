import { describe, expect, it } from "vitest";

import { createIf001CallbackHandler } from "../../../src/server/application/if-001/callback-handler";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

describe("T-036 PR-002 FNC-002 reject logout red tests", () => {
  it("TC-ST-FR-004-004: FR-004 同意拒否時は SCR-001 へ戻しセッション破棄を返す", async () => {
    const callbackHandler = createIf001CallbackHandler({
      authSessionService: {
        async resolvePostLogin() {
          return { route: "SCR-002" as const };
        },
      },
    });

    const result = await callbackHandler({ userId: "user-rejected", consentState: "rejected" });

    expect(result).toEqual({
      route: "SCR-001",
      sessionCleared: true,
      auditAction: "LOGIN_FAILED",
    });
  });

  it("FNC-002 観点: FR-004 と SCR-001 拒否導線を固定する", async () => {
    let resolvePostLoginCalled = false;
    const callbackHandler = createIf001CallbackHandler({
      authSessionService: {
        async resolvePostLogin() {
          resolvePostLoginCalled = true;
          return { route: "SCR-002" as const };
        },
      },
    });

    const result = await callbackHandler({ userId: "user-rejected", consentState: "rejected" });

    expect(resolvePostLoginCalled).toBe(false);
    expect(result.route).toBe("SCR-001");
  });

  it("red: T-037 未実装のため reject logout の副作用を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
