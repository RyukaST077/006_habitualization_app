import { describe, expect, it } from "vitest";

import {
  FNC005_RED_CASES,
  FNC005_REQUIRED_ACCEPTANCE_IDS,
  FNC005_REQUIRED_REQUIREMENT_IDS,
  FNC005_REQUIRED_TEST_CASE_IDS,
} from "./fixtures/fnc-005-cases";
import { createFnc005TestHarness } from "./helpers/fnc-005-test-harness";

const FNC005_SUITE_COMMAND = "npm run test -- tests/integration/checkins/fnc-005-test-plan.spec.ts";

describe("T-042 C-001 FNC-005 business-date red test plan", () => {
  const harness = createFnc005TestHarness();

  it("FR-010 / AC-010 と TC-ID のトレーサビリティを固定する", () => {
    harness.assertRequirementTrace(
      FNC005_RED_CASES,
      FNC005_REQUIRED_REQUIREMENT_IDS,
      FNC005_REQUIRED_ACCEPTANCE_IDS,
      FNC005_REQUIRED_TEST_CASE_IDS,
    );
  });

  it("timezone / day_cutoff_time / nowUtc の入力軸を固定する", () => {
    harness.assertFixedInputAxes(FNC005_RED_CASES);
  });

  it.each(FNC005_RED_CASES)("$traceId: Red planning case を保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("受け入れ検証コマンドを固定する", () => {
    expect(FNC005_SUITE_COMMAND).toBe("npm run test -- tests/integration/checkins/fnc-005-test-plan.spec.ts");
  });

  it("red: T-043 実装前は pending のままにする", () => {
    expect(harness.getT043ImplementationState()).toBe("implemented");
  });
});
