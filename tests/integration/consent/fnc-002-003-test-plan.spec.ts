import { describe, expect, it } from "vitest";

import {
  CONSENT_PLAN_TRACE_LINKED_REQUIREMENT_IDS,
  CONSENT_PLAN_TRACE_REQUIREMENT_IDS,
  CONSENT_QUALITY_GATE_COMMAND,
  CONSENT_RED_CASES,
  CONSENT_REGRESSION_SUITE_COMMAND,
  CONSENT_ROUTING_SMOKE_COMMAND,
  CONSENT_REQUIRED_ACCEPTANCE_IDS,
  CONSENT_REQUIRED_PERSPECTIVES,
  CONSENT_REQUIRED_REQUIREMENT_IDS,
} from "./fixtures/fnc-002-003-cases";
import { createConsentTestHarness } from "./helpers/consent-test-harness";

const harness = createConsentTestHarness();

describe("T-038 PR-003 FNC-002/FNC-003 consent regression plan", () => {
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

  it("FR-003/FR-005/FR-026 を単一計画テストから追跡可能にする", () => {
    harness.assertSinglePlanTraceability(
      CONSENT_RED_CASES,
      CONSENT_PLAN_TRACE_REQUIREMENT_IDS,
      CONSENT_PLAN_TRACE_LINKED_REQUIREMENT_IDS,
    );
  });

  it("CON-006 一意制約と CON-007 双方同意必須の検証境界を固定する", () => {
    harness.assertConstraintBoundaries(CONSENT_RED_CASES);
  });

  it.each(CONSENT_RED_CASES)("$traceId: 実装済み回帰ケースとして保持する", (testCase) => {
    harness.assertGreenRegressionCase(testCase);
  });

  it("検証導線として受け入れ基準コマンド群を固定する", () => {
    expect(CONSENT_REGRESSION_SUITE_COMMAND).toBe(
      "npm run test -- tests/integration/consent/*.spec.ts tests/integration/repositories/repository-concurrency-red.spec.ts",
    );
    expect(CONSENT_ROUTING_SMOKE_COMMAND).toBe(
      "npm run test -- tests/integration/routing/auth-session-redirect-red.spec.ts tests/e2e/smoke/auth-consent-home.spec.ts",
    );
    expect(CONSENT_QUALITY_GATE_COMMAND).toBe("npm run lint && npm run typecheck");
  });

  it("green: 同意判定/履歴/監査シナリオを回帰固定する", () => {
    expect(harness.getT037ImplementationState()).toBe("implemented");
  });
});
