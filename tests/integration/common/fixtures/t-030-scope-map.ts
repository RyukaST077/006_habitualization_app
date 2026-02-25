export type T030RequirementId = "FR-025" | "FR-026";
export type T030AcceptanceId = "AC-025" | "AC-026";
export type T030ScopePerspective = "COMMON_ERROR_CONTRACT" | "AUDIT_REQUIRED_ASSERTION";

export interface T030ScopeMapEntry {
  traceId: string;
  perspective: T030ScopePerspective;
  requirementId: T030RequirementId;
  acceptanceId: T030AcceptanceId;
  interfaceId: "IF-002" | "IF-005";
  moduleId: "M-010";
  tableId: "TBL-008";
  errorContractStatusSet?: readonly [403, 409, 500];
  auditRequiredFields?: readonly string[];
}

export const T030_REQUIRED_TRACE_TERMS = ["FR-025", "FR-026", "AC-025", "AC-026"] as const;

export const T030_SCOPE_MAP: readonly T030ScopeMapEntry[] = [
  {
    traceId: "T-030/IF-002/common-error-contract/FR-025/AC-025",
    perspective: "COMMON_ERROR_CONTRACT",
    requirementId: "FR-025",
    acceptanceId: "AC-025",
    interfaceId: "IF-002",
    moduleId: "M-010",
    tableId: "TBL-008",
    errorContractStatusSet: [403, 409, 500],
  },
  {
    traceId: "T-030/TBL-008/audit-required-assert/FR-026/AC-026",
    perspective: "AUDIT_REQUIRED_ASSERTION",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
    interfaceId: "IF-005",
    moduleId: "M-010",
    tableId: "TBL-008",
    auditRequiredFields: ["actor", "occurred_at", "action", "target_id", "result", "old_version", "new_version", "policy_type"],
  },
] as const;

export const T030_RED_TO_GREEN_TARGETS = [
  {
    traceId: "T-030/T-031/common-error/FR-025",
    targetSpecPath: "tests/integration/common/t-030-app-error-red.spec.ts",
    expectedPhase: "RED",
  },
  {
    traceId: "T-030/T-031/audit-required/FR-026",
    targetSpecPath: "tests/integration/common/t-030-audit-assert-red.spec.ts",
    expectedPhase: "RED",
  },
] as const;
