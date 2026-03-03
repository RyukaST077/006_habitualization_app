import { describe, expect, it } from "vitest";

import { IF002_HABIT_STATUS_TRANSITION_CASES } from "../api/fixtures/if-002-cases";
import { REPOSITORY_HABIT_STATUS_TRANSITION_CASES } from "../repositories/fixtures/repository-cases";
import {
  FNC004_RED_CASES,
  FNC004_REQUIRED_ACCEPTANCE_IDS,
  FNC004_REQUIRED_EXCEPTION_IDS,
  FNC004_REQUIRED_OPERATIONS,
  FNC004_REQUIRED_REQUIREMENT_IDS,
  FNC004_REQUIRED_TBL002_CONSTRAINT_IDS,
} from "./fixtures/fnc-004-cases";
import { createFnc004TestHarness } from "./helpers/fnc-004-test-harness";

const FNC004_SUITE_COMMAND = "npm run test -- tests/integration/habits/fnc-004-test-plan.spec.ts";
const FNC004_STATUS_REGRESSION_COMMAND =
  "npm run test -- tests/integration/habits/habit-service-green.spec.ts tests/integration/repositories/habit-repository-lifecycle-red.spec.ts tests/integration/api/if-002-habits-status-red.spec.ts";
const FNC004_QUALITY_GATE_COMMAND = "npm run lint && npm run typecheck";

describe("T-041 PR-003 FNC-004 habit lifecycle regression plan", () => {
  const harness = createFnc004TestHarness();

  it("FR-006..009 と AC-006..009 のトレーサビリティを固定する", () => {
    harness.assertRequirementTrace(
      FNC004_RED_CASES,
      FNC004_REQUIRED_REQUIREMENT_IDS,
      FNC004_REQUIRED_ACCEPTANCE_IDS,
    );
  });

  it("作成/更新/アーカイブ/再開の4分類を計画ケースへ固定する", () => {
    harness.assertLifecycleCoverage(FNC004_RED_CASES, FNC004_REQUIRED_OPERATIONS);
  });

  it("EX-003 と EX-004 を FNC-004 の必須異常系として固定する", () => {
    harness.assertExceptionCoverage(FNC004_RED_CASES, FNC004_REQUIRED_EXCEPTION_IDS);
  });

  it("TBL-002 制約(name長/status/RLS)の観点をケース定義へ固定する", () => {
    harness.assertTbl002Constraints(FNC004_RED_CASES, FNC004_REQUIRED_TBL002_CONSTRAINT_IDS);
  });

  it("状態遷移観点を API/Repository 回帰テスト導線へ接続する", () => {
    harness.assertTransitionRegressionTraceability(
      FNC004_RED_CASES,
      IF002_HABIT_STATUS_TRANSITION_CASES,
      REPOSITORY_HABIT_STATUS_TRANSITION_CASES,
    );
  });

  it.each(FNC004_RED_CASES)("$traceId: Red planning case を保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("受け入れ検証コマンドを固定する", () => {
    expect(FNC004_SUITE_COMMAND).toBe("npm run test -- tests/integration/habits/fnc-004-test-plan.spec.ts");
    expect(FNC004_STATUS_REGRESSION_COMMAND).toBe(
      "npm run test -- tests/integration/habits/habit-service-green.spec.ts tests/integration/repositories/habit-repository-lifecycle-red.spec.ts tests/integration/api/if-002-habits-status-red.spec.ts",
    );
    expect(FNC004_QUALITY_GATE_COMMAND).toBe("npm run lint && npm run typecheck");
  });

  it("green: T-040 実装完了後は FNC-004 lifecycle が implemented である", () => {
    expect(harness.getT040ImplementationState()).toBe("implemented");
  });
});
