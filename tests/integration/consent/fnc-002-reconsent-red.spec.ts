import { describe, expect, it } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { CONSENT_RED_CASES } from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

describe("T-036 PR-002 FNC-002 re-consent red tests", () => {
  it("TC-IT-FR-003-003: IF-004 policy_settings 更新後は旧版同意ユーザーに re-consent を要求する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-008"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("TC-IT-FR-003-003: re-consent 完了後は SCR-002 へ遷移可能にする", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-008"], "authenticated", "agreed");

    expect(route).toBe(ROUTE_MAP["SCR-002"]);
  });

  it("FNC-002 観点: FR-003 / policy_settings / re-consent の要件トレースを保持する", () => {
    const reconsentCase = CONSENT_RED_CASES.find((entry) => entry.testCaseId === "TC-IT-FR-003-003");

    expect(reconsentCase?.requirementId).toBe("FR-003");
    expect(reconsentCase?.interfaceId).toBe("IF-004");
    expect(reconsentCase?.notes).toContain("policy_settings");
    expect(reconsentCase?.notes).toContain("re-consent");
  });

  it("red: T-037 未実装のため IF-004 更新後の再同意強制を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
