import { describe, expect, it } from "vitest";

import {
  FNC007_RED_CASES,
  FNC007_REQUIRED_ACCEPTANCE_IDS,
  FNC007_REQUIRED_PERSPECTIVES,
  FNC007_REQUIRED_REQUIREMENT_IDS,
  FNC007_REQUIRED_TEST_CASE_IDS,
} from "./fixtures/fnc-007-cases";
import { createFnc007TestHarness } from "./helpers/fnc-007-test-harness";

const FNC007_SUITE_COMMAND = "npm run test -- tests/integration/checkins/fnc-007-test-plan.spec.ts";
const T026_FNC007_REGRESSION_COMMAND = "npm run test -- tests/integration/checkins/fnc-007-regression.spec.ts";
const T026_COMPLETION_GATE_COMMAND =
  "npm run test -- tests/integration/checkins/fnc-007-test-plan.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts && npm run typecheck";

describe("T-026 C-001 FNC-007 red test plan", () => {
  const harness = createFnc007TestHarness();

  it("FR-014 / AC-014 / FR-025 の対応を固定する", () => {
    harness.assertRequirementTrace(
      FNC007_RED_CASES,
      FNC007_REQUIRED_REQUIREMENT_IDS,
      FNC007_REQUIRED_ACCEPTANCE_IDS,
      FNC007_REQUIRED_TEST_CASE_IDS,
    );
  });

  it("TC-IT-FR-014-001..003 をケースへ固定する", () => {
    expect(FNC007_RED_CASES).toHaveLength(3);
    harness.assertPerspectiveCoverage(FNC007_RED_CASES, FNC007_REQUIRED_PERSPECTIVES);
  });

  it.each(FNC007_RED_CASES)("$traceId: Red planning case を保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("T-026 の最小ゲート（回帰/完了コマンド）を spec 内定数に固定する", () => {
    expect(FNC007_SUITE_COMMAND).toBe("npm run test -- tests/integration/checkins/fnc-007-test-plan.spec.ts");
    expect(T026_FNC007_REGRESSION_COMMAND).toBe(
      "npm run test -- tests/integration/checkins/fnc-007-regression.spec.ts",
    );
    expect(T026_COMPLETION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/checkins/fnc-007-test-plan.spec.ts tests/integration/api/if-002-checkins-cancel-red.spec.ts && npm run typecheck",
    );
  });
});
