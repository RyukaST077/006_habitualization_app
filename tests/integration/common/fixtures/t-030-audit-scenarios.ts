import type { T030AuditRequiredField } from "../helpers/t-030-test-harness";

export interface T030AuditMissingFieldScenario {
  traceId: string;
  title: string;
  scope: "audit_logs" | "policy_settings";
  missingField: T030AuditRequiredField;
  requirementId: "FR-026";
  acceptanceId: "AC-026";
}

export const T030_AUDIT_REQUIRED_FIELDS = [
  "actor",
  "occurred_at",
  "action",
  "target_id",
  "result",
  "old_version",
  "new_version",
  "policy_type",
] as const;

export const T030_AUDIT_MISSING_FIELD_SCENARIOS: readonly T030AuditMissingFieldScenario[] = [
  {
    traceId: "T-030/IF-002/TBL-008/audit-logs/missing-actor/FR-026/AC-026",
    title: "audit_logs は actor 欠落を許容しない",
    scope: "audit_logs",
    missingField: "actor",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/audit-logs/missing-occurred-at/FR-026/AC-026",
    title: "audit_logs は occurred_at 欠落を許容しない",
    scope: "audit_logs",
    missingField: "occurred_at",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/audit-logs/missing-action/FR-026/AC-026",
    title: "audit_logs は action 欠落を許容しない",
    scope: "audit_logs",
    missingField: "action",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/audit-logs/missing-target-id/FR-026/AC-026",
    title: "audit_logs は target_id 欠落を許容しない",
    scope: "audit_logs",
    missingField: "target_id",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/audit-logs/missing-result/FR-026/AC-026",
    title: "audit_logs は result 欠落を許容しない",
    scope: "audit_logs",
    missingField: "result",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/policy-settings/missing-old-version/FR-026/AC-026",
    title: "policy_settings は old_version 欠落を許容しない",
    scope: "policy_settings",
    missingField: "old_version",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/policy-settings/missing-new-version/FR-026/AC-026",
    title: "policy_settings は new_version 欠落を許容しない",
    scope: "policy_settings",
    missingField: "new_version",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
  {
    traceId: "T-030/IF-002/TBL-008/policy-settings/missing-policy-type/FR-026/AC-026",
    title: "policy_settings は policy_type 欠落を許容しない",
    scope: "policy_settings",
    missingField: "policy_type",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
  },
] as const;
