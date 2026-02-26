import { describe, expect, it } from "vitest";

import { SCR008PolicyConsentPage } from "../../../src/screens/SCR-008PolicyConsentPage";

const T037_IMPLEMENTATION_STATE = "pending" as const;

describe("T-036 PR-004 SCR-008 policy consent UI red tests", () => {
  it("TC-ST-CON-007-001: CON-007 terms/privacy の双方チェックONまでは同意ボタンを無効化する", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.terms.checked", false);
    expect(page).toHaveProperty("ui.privacy.checked", false);
    expect(page).toHaveProperty("ui.acceptButton.disabled", true);
  });

  it("TC-ST-CON-007-002: terms/privacy 双方ON時のみ同意ボタンを活性化する", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("ui.acceptButton.requires", ["terms", "privacy"]);
    expect(page).toHaveProperty("ui.acceptButton.disabled", false);
  });

  it("FR-026 観点: 同意操作は POLICY_CONSENT_ACCEPT/POLICY_CONSENT_REJECT 監査トレースを要求する", () => {
    const page = SCR008PolicyConsentPage({ screenId: "SCR-008" }) as unknown as Record<string, unknown>;

    expect(page).toHaveProperty("audit.accept.action", "POLICY_CONSENT_ACCEPT");
    expect(page).toHaveProperty("audit.reject.action", "POLICY_CONSENT_REJECT");
    expect(page).toHaveProperty("audit.requirementId", "FR-026");
  });

  it("red: T-037 未実装のため SCR-008 同意UI要件を失敗状態で固定する", () => {
    expect(T037_IMPLEMENTATION_STATE).toBe("implemented");
  });
});
