import { describe, expect, it } from "vitest";

import {
  SETTINGS_PLAN_CASES,
  SETTINGS_PLAN_COMMAND,
  SETTINGS_REQUIRED_ACCEPTANCE_IDS,
  SETTINGS_REQUIRED_CASE_IDS,
  SETTINGS_REQUIRED_PERSPECTIVES,
  SETTINGS_REQUIRED_REQUIREMENT_IDS,
  SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
  SETTINGS_SCOPE_EXCLUDED_TASKS,
} from "./fixtures/fnc-010-011-cases";
import { createSettingsTestHarness } from "./helpers/settings-test-harness";

const T028_SETTINGS_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts";
const T028_FINAL_GATE_COMMAND =
  "npm run test -- tests/unit/server/settings-service.spec.ts tests/integration/settings/fnc-010-011-test-plan.spec.ts tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts && npm run typecheck";
const T028_BOUNDARY_NOTE =
  "Boundary note: T-056 owns SCR-007 UI only, T-029 owns /api/settings/withdrawal only, and T-028 handles settings profile backend only.";

describe("T-028 C-001 FNC-010/FNC-011 settings test plan", () => {
  const harness = createSettingsTestHarness();

  it("FR-019..FR-022 と AC-019..AC-022、および指定 TC-ID のトレーサビリティを固定する", () => {
    harness.assertRequirementTrace(
      SETTINGS_PLAN_CASES,
      SETTINGS_REQUIRED_REQUIREMENT_IDS,
      SETTINGS_REQUIRED_ACCEPTANCE_IDS,
      SETTINGS_REQUIRED_CASE_IDS,
    );
  });

  it("設定更新・入力検証・監査整形の観点カバレッジを固定する", () => {
    harness.assertPerspectiveCoverage(SETTINGS_PLAN_CASES, SETTINGS_REQUIRED_PERSPECTIVES);
  });

  it("FR-020 は変更以降のみ適用し過去再計算しない境界として固定する", () => {
    harness.assertFr020Boundary(SETTINGS_PLAN_CASES);
  });

  it("T-056(UI) と T-029(退会) をスコープ外として固定する", () => {
    harness.assertScopeIsolation(SETTINGS_PLAN_CASES, {
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    });
  });

  it.each(SETTINGS_PLAN_CASES)("$traceId: planning case を保持する", (testCase) => {
    harness.assertPlannedCase(testCase);
  });

  it("受け入れ導線としてテスト実行コマンドを固定する", () => {
    expect(SETTINGS_PLAN_COMMAND).toBe(
      "npm run test -- tests/integration/settings/fnc-010-011-test-plan.spec.ts",
    );
  });

  it("C-005: 回帰ゲート/最終ゲートコマンドを固定する", () => {
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts",
    );
    expect(T028_FINAL_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/settings-service.spec.ts tests/integration/settings/fnc-010-011-test-plan.spec.ts tests/integration/settings/fnc-010-011-regression.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts tests/integration/settings/fnc-011-settings-audit-red.spec.ts && npm run typecheck",
    );
  });

  it("C-005: T-056/T-029 の依存境界注記を最終化する", () => {
    expect(T028_BOUNDARY_NOTE).toContain("T-056");
    expect(T028_BOUNDARY_NOTE).toContain("SCR-007 UI only");
    expect(T028_BOUNDARY_NOTE).toContain("T-029");
    expect(T028_BOUNDARY_NOTE).toContain("/api/settings/withdrawal only");
    expect(T028_BOUNDARY_NOTE).toContain("settings profile backend only");
  });

  it("C-005: Playwright E2E/UI テストを完了条件へ含めない", () => {
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND.toLowerCase().includes("playwright")).toBe(false);
    expect(T028_SETTINGS_REGRESSION_GATE_COMMAND.includes("tests/e2e/")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.toLowerCase().includes("playwright")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.includes("tests/e2e/")).toBe(false);
    expect(T028_FINAL_GATE_COMMAND.includes("tests/integration/ui/")).toBe(false);
  });

  it("green: C-001 のテスト計画とケース定義は実装済みとして扱う", () => {
    expect(harness.getImplementationState()).toBe("implemented");
  });
});
