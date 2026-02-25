import { describe, expect, it } from "vitest";

import { FNC013_AUDIT_REQUIRED_SCENARIOS } from "./fixtures/fnc-013-rls-cases";

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

describe("T-028 PR-003 FR-026 audit required fields red tests", () => {
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

  it("red: audit required enforcement は未実装のため失敗する", () => {
    const constraintState: "planned" | "implemented" = "planned";

    expect(constraintState).toBe("implemented");
  });
});
