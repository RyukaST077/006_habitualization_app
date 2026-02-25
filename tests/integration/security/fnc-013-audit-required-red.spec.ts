import { describe, expect, it } from "vitest";

import { FNC013_AUDIT_REQUIRED_SCENARIOS } from "./fixtures/fnc-013-rls-cases";
import { createFnc013RlsTestHarness } from "./helpers/fnc-013-rls-test-harness";

function createAuditValidationSql(target: "audit_logs" | "policy_settings", missingField: string): string {
  if (target === "audit_logs") {
    return [
      "-- FR-026 AC-026 audit_logs required fields",
      `insert into public.audit_logs (trace_id, missing_field)` ,
      `values ('red-audit-required', '${missingField}');`,
    ].join("\n");
  }

  return [
    "-- FR-026 AC-026 policy_settings metadata_json required fields",
    "update public.policy_settings",
    `set metadata_json = jsonb_build_object('missing_field', '${missingField}')`,
    "where policy_key = 'terms';",
  ].join("\n");
}

describe("T-029 PR-004 FR-026 audit required fields green tests", () => {
  it("audit_logs 必須項目 actor/occurred_at/action/target_id/result 欠落は失敗となる前提を持つ", () => {
    const requiredFields = ["actor", "occurred_at", "action", "target_id", "result"];
    const auditLogScenarios = FNC013_AUDIT_REQUIRED_SCENARIOS.filter((scenario) => scenario.target === "audit_logs");

    expect(auditLogScenarios.length).toBe(requiredFields.length);

    requiredFields.forEach((field) => {
      expect(auditLogScenarios.some((scenario) => scenario.missingField === field)).toBe(true);
    });
  });

  it("policy_settings metadata_json の old_version/new_version/policy_type 欠落は失敗となる前提を持つ", () => {
    const requiredMetadataFields = ["old_version", "new_version", "policy_type"];
    const policySettingsScenarios = FNC013_AUDIT_REQUIRED_SCENARIOS.filter(
      (scenario) => scenario.target === "policy_settings",
    );

    expect(policySettingsScenarios.length).toBe(requiredMetadataFields.length);

    requiredMetadataFields.forEach((field) => {
      expect(policySettingsScenarios.some((scenario) => scenario.missingField === field)).toBe(true);
    });
  });

  it.each(FNC013_AUDIT_REQUIRED_SCENARIOS)("$traceId: required field violation SQL を固定する", (scenario) => {
    const sql = createAuditValidationSql(scenario.target, scenario.missingField);

    expect(sql).toContain("FR-026");
    expect(sql).toContain("AC-026");
    expect(sql).toContain(scenario.missingField);
  });

  it.each(FNC013_AUDIT_REQUIRED_SCENARIOS)(
    "$traceId: 必須項目欠落を missing_required_fields として検知する",
    async (scenario) => {
      const harness = createFnc013RlsTestHarness();
      const audit = await harness.checkAuditRecord({ traceId: scenario.traceId, target: scenario.target });

      expect(audit.traceId).toBe(scenario.traceId);
      expect(audit.sql).toContain("public.");
      expect(audit.auditRecordState).toBe("missing_required_fields");
      expect(audit.implementationState).toBe("implemented");
    },
  );

  it("green: 必須項目が揃うケースは required_fields_present を返す", async () => {
    const harness = createFnc013RlsTestHarness();
    const auditLogs = await harness.checkAuditRecord({
      traceId: "FNC-013/FR-026/AC-026/audit_logs/complete",
      target: "audit_logs",
    });
    const policySettings = await harness.checkAuditRecord({
      traceId: "FNC-013/FR-026/AC-026/policy_settings/complete",
      target: "policy_settings",
    });

    expect(auditLogs.auditRecordState).toBe("required_fields_present");
    expect(policySettings.auditRecordState).toBe("required_fields_present");
    expect(policySettings.sql).toContain("old_version");
    expect(policySettings.sql).toContain("new_version");
    expect(policySettings.sql).toContain("policy_type");
  });
});
