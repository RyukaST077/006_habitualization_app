import { describe, expect, it } from "vitest";

import { T030_ACTORS, T030_COMMON_ROLE_ID } from "./fixtures/t-030-actors";
import {
  T030_AUDIT_MISSING_FIELD_SCENARIOS,
  T030_AUDIT_REQUIRED_FIELDS,
} from "./fixtures/t-030-audit-scenarios";
import { createT030TraceId, isT030TraceId } from "./helpers/t-030-trace-utils";
import { createT030TestHarness } from "./helpers/t-030-test-harness";

describe("T-030 PR-003 audit required field assert red tests", () => {
  it("共通アクター fixture(USER-A/USER-B/ROLE-002) を監査試験でも再利用できる", () => {
    expect(T030_ACTORS["USER-A"].roleId).toBe(T030_COMMON_ROLE_ID);
    expect(T030_ACTORS["USER-B"].roleId).toBe(T030_COMMON_ROLE_ID);
  });

  it("欠落ケースに監査必須項目名 actor/occurred_at/action/target_id/result/old_version/new_version/policy_type を保持する", () => {
    const missingFields = new Set(T030_AUDIT_MISSING_FIELD_SCENARIOS.map((scenario) => scenario.missingField));

    expect(T030_AUDIT_MISSING_FIELD_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    T030_AUDIT_REQUIRED_FIELDS.forEach((field) => {
      expect(missingFields.has(field)).toBe(true);
    });
  });

  it("audit_logs の必須項目欠落ケースを Red 化する", () => {
    const auditLogsFields = new Set(
      T030_AUDIT_MISSING_FIELD_SCENARIOS.filter((scenario) => scenario.scope === "audit_logs").map((scenario) => scenario.missingField),
    );

    expect(auditLogsFields).toEqual(new Set(["actor", "occurred_at", "action", "target_id", "result"]));
  });

  it("policy_settings の old_version/new_version/policy_type 欠落ケースを Red 化する", () => {
    const policySettingsFields = new Set(
      T030_AUDIT_MISSING_FIELD_SCENARIOS
        .filter((scenario) => scenario.scope === "policy_settings")
        .map((scenario) => scenario.missingField),
    );

    expect(policySettingsFields).toEqual(new Set(["old_version", "new_version", "policy_type"]));
  });

  it("FR-026/AC-026 トレースをケース定義に保持する", () => {
    T030_AUDIT_MISSING_FIELD_SCENARIOS.forEach((scenario) => {
      expect(scenario.traceId).toContain("FR-026");
      expect(scenario.traceId).toContain("AC-026");
      expect(scenario.requirementId).toBe("FR-026");
      expect(scenario.acceptanceId).toBe("AC-026");
    });
  });

  it.each(T030_AUDIT_MISSING_FIELD_SCENARIOS)("$traceId: 欠落ケース契約を検証", (scenario) => {
    const harness = createT030TestHarness();
    const traceId = createT030TraceId(scenario.traceId);

    expect(isT030TraceId(traceId)).toBe(true);
    harness.assertAuditMissingFieldScenarioContract(scenario, T030_AUDIT_REQUIRED_FIELDS);
  });

  it("red: T-031 実装前のため監査必須項目アサートは未実装として失敗させる", () => {
    const harness = createT030TestHarness();
    expect(harness.getT031ImplementationState()).toBe("implemented");
  });
});
