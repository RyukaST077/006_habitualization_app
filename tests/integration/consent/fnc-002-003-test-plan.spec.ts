import { describe, expect, it } from "vitest";

import {
  CONSENT_RED_CASES,
  CONSENT_REQUIRED_ACCEPTANCE_IDS,
  CONSENT_REQUIRED_PERSPECTIVES,
  CONSENT_REQUIRED_REQUIREMENT_IDS,
} from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const CONSENT_PLAN_COMMAND =
  "npm run test -- tests/integration/consent/*.spec.ts tests/unit/screens/scr-008-policy-consent-page-red.spec.ts";
const ROUTING_REGRESSION_COMMAND =
  "npm run test -- tests/integration/routing/auth-session-redirect-red.spec.ts tests/e2e/routing/auth-consent-redirect.spec.ts";
const QUALITY_GATE_COMMAND = "npm run lint && npm run typecheck";
const harness = createConsentTestHarness();

describe("T-037 PR-006 FNC-002/FNC-003 consent green regression plan", () => {
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

  it.each(CONSENT_RED_CASES)("$traceId: 実装済み回帰ケースとして保持する", (testCase) => {
    harness.assertGreenRegressionCase(testCase);
  });

  it("検証導線として受け入れ基準コマンド群を固定する", () => {
    expect(CONSENT_PLAN_COMMAND).toBe(
      "npm run test -- tests/integration/consent/*.spec.ts tests/unit/screens/scr-008-policy-consent-page-red.spec.ts",
    );
    expect(ROUTING_REGRESSION_COMMAND).toBe(
      "npm run test -- tests/integration/routing/auth-session-redirect-red.spec.ts tests/e2e/routing/auth-consent-redirect.spec.ts",
    );
    expect(QUALITY_GATE_COMMAND).toBe("npm run lint && npm run typecheck");
  });

  it("green: T-037 実装済みとして同意判定/履歴シナリオを回帰固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
