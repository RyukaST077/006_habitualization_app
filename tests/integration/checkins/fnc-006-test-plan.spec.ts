import { describe, expect, it } from "vitest";

import {
  FNC006_RED_CASES,
  FNC006_REQUIRED_ACCEPTANCE_IDS,
  FNC006_REQUIRED_PERSPECTIVES,
  FNC006_REQUIRED_REQUIREMENT_IDS,
  FNC006_REQUIRED_TEST_CASE_IDS,
} from "./fixtures/fnc-006-cases";
import { createFnc006TestHarness } from "./helpers/fnc-006-test-harness";

const T025_FNC006_TEST_GATE_COMMAND =
  "npm run test -- tests/integration/checkins/fnc-006-test-plan.spec.ts tests/integration/checkins/fnc-006-idempotency-race.spec.ts tests/integration/api/if-002-checkins-register-red.spec.ts";

describe("T-025 C-001 FNC-006 red test plan", () => {
  const harness = createFnc006TestHarness();

  it("FR-011..013 と AC-011..013 の対応を固定し FR-025 認可観点を含める", () => {
    harness.assertRequirementTrace(
      FNC006_RED_CASES,
      FNC006_REQUIRED_REQUIREMENT_IDS,
      FNC006_REQUIRED_ACCEPTANCE_IDS,
      FNC006_REQUIRED_TEST_CASE_IDS,
    );
  });

  it("TC-FNC-006 の IT 自動化対象4ケースを固定する", () => {
    expect(FNC006_RED_CASES).toHaveLength(4);
    harness.assertPerspectiveCoverage(FNC006_RED_CASES, FNC006_REQUIRED_PERSPECTIVES);
  });

  it.each(FNC006_RED_CASES)("$traceId: Red planning case を保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("T-025 対象テスト群の実行コマンドを1本に固定する", () => {
    expect(T025_FNC006_TEST_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/checkins/fnc-006-test-plan.spec.ts tests/integration/checkins/fnc-006-idempotency-race.spec.ts tests/integration/api/if-002-checkins-register-red.spec.ts",
    );
  });
});
