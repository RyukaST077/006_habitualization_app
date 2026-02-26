import { describe, expect, it } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import { resolveAuthConsentRedirect } from "../../../src/app/router";
import { CONSENT_RED_CASES } from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

describe("T-036 PR-002 FNC-002 consent gate red tests", () => {
  it("TC-IT-FR-002-001: FR-002 未同意ユーザーは SCR-008 へ強制する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-002"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("TC-IT-FR-003-002: FR-003 保護画面遷移は未同意時に SCR-008 へ退避する", () => {
    const route = resolveAuthConsentRedirect(ROUTE_MAP["SCR-003"], "authenticated", "unknown");

    expect(route).toBe(ROUTE_MAP["SCR-008"]);
  });

  it("FNC-002 観点: FR-002/FR-003 と SCR-008 のトレースを保持する", () => {
    const traceTargets = CONSENT_RED_CASES.filter((entry) =>
      entry.testCaseId === "TC-IT-FR-002-001" || entry.testCaseId === "TC-IT-FR-003-003",
    );

    expect(traceTargets.every((entry) => entry.requirementId === "FR-002" || entry.requirementId === "FR-003")).toBe(true);
    expect(traceTargets.some((entry) => entry.notes.includes("SCR-008"))).toBe(true);
  });

  it("red: T-037 未実装のため FNC-002 同意ゲート判定を失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
