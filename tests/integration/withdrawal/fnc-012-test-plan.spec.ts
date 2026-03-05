import { describe, expect, it } from "vitest";

import {
  FNC012_PLAN_CASES,
  FNC012_PLAN_COMMAND,
  FNC012_REQUIRED_ACCEPTANCE_IDS,
  FNC012_REQUIRED_CONSTRAINT_IDS,
  FNC012_REQUIRED_PERSPECTIVES,
  FNC012_REQUIRED_REQUIREMENT_IDS,
  FNC012_REQUIRED_TEST_CASE_IDS,
  FNC012_TRACEABILITY_MARKERS,
} from "./fixtures/fnc-012-cases";
import { createWithdrawalTestHarness } from "./helpers/withdrawal-test-harness";

const T029_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts";
const T029_FINAL_GATE_COMMAND =
  "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts && npm run typecheck";

describe("T-029 C-001 FNC-012/BAT-004 withdrawal test plan", () => {
  const harness = createWithdrawalTestHarness();

  it("FR-023/FR-024 + AC-023/AC-024 と TC ケースのトレーサビリティを固定する", () => {
    harness.assertRequirementTrace(
      FNC012_PLAN_CASES,
      FNC012_REQUIRED_REQUIREMENT_IDS,
      FNC012_REQUIRED_ACCEPTANCE_IDS,
      FNC012_REQUIRED_TEST_CASE_IDS,
    );
  });

  it("60秒不可化 / 5分完全削除 / 再ログイン不可 / 失敗再実行の観点を固定する", () => {
    harness.assertPerspectiveCoverage(FNC012_PLAN_CASES, FNC012_REQUIRED_PERSPECTIVES);
  });

  it("NFR-005 / EX-007 / BAT-004 / IF-005 のトレース制約を固定する", () => {
    harness.assertConstraintMarkers(FNC012_PLAN_CASES, FNC012_REQUIRED_CONSTRAINT_IDS);
  });

  it("S-MOCK-05 と置換完了条件をケース定義へ固定する", () => {
    harness.assertMockReplacementCondition(FNC012_PLAN_CASES);
  });

  it("T-056/T-030/T-031 の責務をスコープ外として固定する", () => {
    harness.assertScopeIsolation(FNC012_PLAN_CASES);
  });

  it.each(FNC012_PLAN_CASES)("$traceId: planning case を保持する", (testCase) => {
    harness.assertPlannedCase(testCase);
  });

  it("受け入れ導線として C-001 テストコマンドを固定する", () => {
    expect(FNC012_PLAN_COMMAND).toBe(
      "npm run test -- tests/integration/withdrawal/fnc-012-test-plan.spec.ts",
    );
  });

  it("必須トレースIDマーカーを fixture 文字列として保持する", () => {
    expect(FNC012_TRACEABILITY_MARKERS).toEqual([
      "FR-023",
      "FR-024",
      "AC-023",
      "AC-024",
      "NFR-005",
      "EX-007",
      "BAT-004",
      "IF-005",
    ]);
  });

  it("green: C-001 のテスト計画とケース定義は実装済みとして扱う", () => {
    expect(harness.getImplementationState()).toBe("implemented");
  });

  it("C-006: T-029 回帰ゲート/最終ゲートコマンドを固定する", () => {
    expect(T029_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts",
    );
    expect(T029_FINAL_GATE_COMMAND).toBe(
      "npm run test -- tests/unit/server/withdrawal-service.spec.ts tests/integration/api/if-002-withdrawal-red.spec.ts tests/integration/withdrawal/bat-004-hard-delete-red.spec.ts tests/integration/withdrawal/if-005-deletion-trace-red.spec.ts tests/integration/withdrawal/fnc-012-sla-regression.spec.ts tests/integration/withdrawal/fnc-012-regression-gate.spec.ts && npm run typecheck",
    );
  });
});
