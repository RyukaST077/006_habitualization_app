import { describe, expect, it } from "vitest";

import {
  FNC008_RED_CASES,
  FNC008_REQUIRED_ACCEPTANCE_IDS,
  FNC008_REQUIRED_PERSPECTIVES,
  FNC008_REQUIRED_REQUIREMENT_IDS,
  FNC008_REQUIRED_TEST_CASE_IDS,
} from "./fixtures/fnc-008-cases";
import { createFnc008TestHarness } from "./helpers/fnc-008-test-harness";

const FNC008_SUITE_COMMAND = "npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts";
const T027_FNC008_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/integration/visualization/fnc-008-regression.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts";
const T027_COMPLETION_GATE_COMMAND =
  "npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts tests/unit/server/streak-service.spec.ts tests/unit/server/history-service.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck";

describe("T-027 C-005 FNC-008 completion gate plan", () => {
  const harness = createFnc008TestHarness();

  it("FR-015/FR-016/FR-017 と AC-015/AC-016/AC-017 の対応を固定する", () => {
    harness.assertRequirementTrace(
      FNC008_RED_CASES,
      FNC008_REQUIRED_REQUIREMENT_IDS,
      FNC008_REQUIRED_ACCEPTANCE_IDS,
      FNC008_REQUIRED_TEST_CASE_IDS,
    );
  });

  it("TC-IT-FR-015-001, TC-IT-FR-015-002, TC-ST-FR-016-003, TC-ST-FR-017-004 をケース化する", () => {
    expect(FNC008_RED_CASES).toHaveLength(4);
    harness.assertPerspectiveCoverage(FNC008_RED_CASES, FNC008_REQUIRED_PERSPECTIVES);
  });

  it("trace corpus に FR/AC 固定語を保持する", () => {
    const traceCorpus = FNC008_RED_CASES.map((testCase) => {
      return `${testCase.traceId} ${testCase.requirementId} ${testCase.acceptanceId} ${testCase.notes}`;
    }).join(" ");

    ["FR-015", "FR-016", "FR-017", "AC-015", "AC-016", "AC-017"].forEach((term) => {
      expect(traceCorpus).toContain(term);
    });
  });

  it.each(FNC008_RED_CASES)("$traceId: Red planning case を保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("T-027 の回帰/完了ゲートコマンドを spec 内定数に明記して固定する", () => {
    expect(FNC008_SUITE_COMMAND).toBe("npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts");
    expect(T027_FNC008_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/visualization/fnc-008-regression.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts",
    );
    expect(T027_COMPLETION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts tests/unit/server/streak-service.spec.ts tests/unit/server/history-service.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck",
    );
  });
});
