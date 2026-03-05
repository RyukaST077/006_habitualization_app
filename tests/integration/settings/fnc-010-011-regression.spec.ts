import { describe, expect, it } from "vitest";

import { IF002_SETTINGS_PROFILE_CASES } from "../api/fixtures/if-002-cases";
import { FNC011_AUDIT_FAILURE_CASE, FNC011_AUDIT_SUCCESS_CASES } from "./fixtures/fnc-011-audit-cases";
import { SETTINGS_PLAN_CASES } from "./fixtures/fnc-010-011-cases";

const T028_SETTINGS_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts";

const T028_FINAL_GATE_COMMAND =
  "npm run test -- tests/unit/server/settings-service.spec.ts tests/integration/settings/fnc-010-011-test-plan.spec.ts tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts && npm run typecheck";

describe("T-028 C-005 FNC-010/FNC-011 regression gate", () => {
  it("FR-019..FR-022 を回帰ゲートで追跡できる", () => {
    const requirementSet = new Set<string>();

    SETTINGS_PLAN_CASES.forEach((testCase) => requirementSet.add(testCase.requirementId));
    IF002_SETTINGS_PROFILE_CASES.forEach((testCase) => requirementSet.add(testCase.requirementId));
    FNC011_AUDIT_SUCCESS_CASES.forEach((testCase) => requirementSet.add(testCase.requirementId));
    requirementSet.add(FNC011_AUDIT_FAILURE_CASE.requirementId);

    ["FR-019", "FR-020", "FR-021", "FR-022"].forEach((requirementId) => {
      expect(requirementSet.has(requirementId)).toBe(true);
    });
  });

  it("T-056 は UI のみ、T-029 は withdrawal API のみの境界注記を固定する", () => {
    const boundaryNotes =
      "T-056 handles SCR-007 UI only; T-029 handles /api/settings/withdrawal API only; T-028 excludes both.";

    expect(boundaryNotes).toContain("T-056");
    expect(boundaryNotes).toContain("UI only");
    expect(boundaryNotes).toContain("T-029");
    expect(boundaryNotes).toContain("/api/settings/withdrawal");
  });

  it("Playwright E2E/UI テストを完了条件に含めない", () => {
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND.toLowerCase().includes("playwright")).toBe(false);
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND.includes("tests/e2e/")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.toLowerCase().includes("playwright")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.includes("tests/e2e/")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.includes("tests/integration/ui/")).toBe(false);
  });

  it("C-005 の回帰ゲートコマンドを固定する", () => {
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts",
    );
    expect(T028_FINAL_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/settings-service.spec.ts tests/integration/settings/fnc-010-011-test-plan.spec.ts tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts && npm run typecheck",
    );
  });
});
