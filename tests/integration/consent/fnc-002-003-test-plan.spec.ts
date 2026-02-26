import { describe, expect, it } from "vitest";

import {
  CONSENT_RED_CASES,
  CONSENT_REQUIRED_ACCEPTANCE_IDS,
  CONSENT_REQUIRED_PERSPECTIVES,
  CONSENT_REQUIRED_REQUIREMENT_IDS,
} from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const CONSENT_PLAN_COMMAND = "npm run test -- tests/integration/consent/fnc-002-003-test-plan.spec.ts";
const harness = createConsentTestHarness();

describe("T-036 PR-001 FNC-002/FNC-003 consent red test plan", () => {
  it("FR-002..FR-005 と AC-002..AC-005 のトレーサビリティを固定する", () => {
    harness.assertRequirementTrace(
      CONSENT_RED_CASES,
      CONSENT_REQUIRED_REQUIREMENT_IDS,
      CONSENT_REQUIRED_ACCEPTANCE_IDS,
    );
  });

  it("判定系・履歴系・監査系を含む観点カバレッジを固定する", () => {
    harness.assertPerspectiveCoverage(CONSENT_RED_CASES, CONSENT_REQUIRED_PERSPECTIVES);
  });

  it("IF-004 更新時の再同意シナリオを T-RSK-003 として固定する", () => {
    harness.assertReconsentRiskBinding(CONSENT_RED_CASES);
  });

  it("CON-006 一意制約と CON-007 双方同意必須の検証境界を固定する", () => {
    harness.assertConstraintBoundaries(CONSENT_RED_CASES);
  });

  it.each(CONSENT_RED_CASES)("$traceId: ケース定義を Red 計画として保持する", (testCase) => {
    harness.assertRedPlanningCase(testCase);
  });

  it("検証導線として単一実行コマンドを固定する", () => {
    expect(CONSENT_PLAN_COMMAND).toBe("npm run test -- tests/integration/consent/fnc-002-003-test-plan.spec.ts");
  });

  it("red: T-037 未実装のため同意判定/履歴シナリオを失敗状態で固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
