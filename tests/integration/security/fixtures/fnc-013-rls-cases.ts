export type Fnc013CaseId =
  | "TC-IT-FR-025-001"
  | "TC-IT-FR-025-002"
  | "TC-IT-FR-025-003"
  | "TC-IT-FR-026-004"
  | "TC-IT-FR-026-005";

export type Fnc013RequirementId = "FR-025" | "FR-026";
export type Fnc013AcceptanceId = "AC-025" | "AC-026";
export type Fnc013Actor = "USER-A" | "USER-B" | "ROLE-002";
export type Fnc013RlsScope =
  | "SELF_ALLOW"
  | "OTHER_DENY"
  | "ROLE_002_BOUNDARY"
  | "AUDIT_REQUIRED_FIELDS";

export interface Fnc013OpsScopeScenario {
  traceId: string;
  actor: "ROLE-002";
  interfaceId: "IF-005";
  queryType: "anonymized_kpi" | "personal_data";
  expectedDecision: "allow" | "deny";
  expectedCode?: "FORBIDDEN";
}

export interface Fnc013AuditRequiredScenario {
  traceId: string;
  requirementId: "FR-026";
  acceptanceId: "AC-026";
  target: "audit_logs" | "policy_settings";
  missingField: "actor" | "occurred_at" | "action" | "target_id" | "result" | "old_version" | "new_version" | "policy_type";
  expectedDecision: "require_audit";
}

export interface Fnc013RlsSqlCaseDefinition {
  traceId: string;
  testCaseId: Fnc013CaseId;
  requirementId: Fnc013RequirementId;
  acceptanceId: Fnc013AcceptanceId;
  actor: Fnc013Actor;
  scope: Fnc013RlsScope;
  target: "profiles" | "habits" | "habit_logs" | "policy_consents" | "audit_logs" | "policy_settings";
  expectedDecision: "allow" | "deny" | "require_audit";
  redPhaseIntent: "RED";
}

export const FNC013_REQUIRED_CASE_IDS: Fnc013CaseId[] = [
  "TC-IT-FR-025-001",
  "TC-IT-FR-025-002",
  "TC-IT-FR-025-003",
  "TC-IT-FR-026-004",
  "TC-IT-FR-026-005",
];

export const FNC013_REQUIRED_TRACE_TERMS = ["FR-025", "FR-026", "AC-025", "AC-026"] as const;
export const FNC013_PR003_REQUIRED_TRACE_TERMS = ["IF-005", "FR-026", "AC-026"] as const;

export const FNC013_RLS_SQL_CASES: Fnc013RlsSqlCaseDefinition[] = [
  {
    traceId: "FNC-013/TC-IT-FR-025-001/FR-025/AC-025/self-allow-profiles",
    testCaseId: "TC-IT-FR-025-001",
    requirementId: "FR-025",
    acceptanceId: "AC-025",
    actor: "USER-A",
    scope: "SELF_ALLOW",
    target: "profiles",
    expectedDecision: "allow",
    redPhaseIntent: "RED",
  },
  {
    traceId: "FNC-013/TC-IT-FR-025-002/FR-025/AC-025/other-deny-habits",
    testCaseId: "TC-IT-FR-025-002",
    requirementId: "FR-025",
    acceptanceId: "AC-025",
    actor: "USER-A",
    scope: "OTHER_DENY",
    target: "habits",
    expectedDecision: "deny",
    redPhaseIntent: "RED",
  },
  {
    traceId: "FNC-013/TC-IT-FR-025-003/FR-025/AC-025/role-002-boundary",
    testCaseId: "TC-IT-FR-025-003",
    requirementId: "FR-025",
    acceptanceId: "AC-025",
    actor: "ROLE-002",
    scope: "ROLE_002_BOUNDARY",
    target: "habit_logs",
    expectedDecision: "deny",
    redPhaseIntent: "RED",
  },
  {
    traceId: "FNC-013/TC-IT-FR-026-004/FR-026/AC-026/audit-required-habit-logs",
    testCaseId: "TC-IT-FR-026-004",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
    actor: "USER-B",
    scope: "AUDIT_REQUIRED_FIELDS",
    target: "audit_logs",
    expectedDecision: "require_audit",
    redPhaseIntent: "RED",
  },
  {
    traceId: "FNC-013/TC-IT-FR-026-005/FR-026/AC-026/audit-required-policy-consents",
    testCaseId: "TC-IT-FR-026-005",
    requirementId: "FR-026",
    acceptanceId: "AC-026",
    actor: "ROLE-002",
    scope: "AUDIT_REQUIRED_FIELDS",
    target: "policy_consents",
    expectedDecision: "require_audit",
    redPhaseIntent: "RED",
  },
];

export const FNC013_OPS_SCOPE_SCENARIOS: Fnc013OpsScopeScenario[] = [
  {
    traceId: "FNC-013/IF-005/FR-026/AC-026/ROLE-002/anonymized-kpi-allow",
    actor: "ROLE-002",
    interfaceId: "IF-005",
    queryType: "anonymized_kpi",
    expectedDecision: "allow",
  },
  {
    traceId: "FNC-013/IF-005/FR-026/AC-026/ROLE-002/personal-data-FORBIDDEN",
    actor: "ROLE-002",
    interfaceId: "IF-005",
    queryType: "personal_data",
    expectedDecision: "deny",
    expectedCode: "FORBIDDEN",
  },
];

const AUDIT_LOG_REQUIRED_FIELDS = ["actor", "occurred_at", "action", "target_id", "result"] as const;
const POLICY_SETTINGS_METADATA_REQUIRED_FIELDS = ["old_version", "new_version", "policy_type"] as const;

export const FNC013_AUDIT_REQUIRED_SCENARIOS: Fnc013AuditRequiredScenario[] = [
  ...AUDIT_LOG_REQUIRED_FIELDS.map((field) => ({
    traceId: `FNC-013/FR-026/AC-026/audit_logs/missing-${field}-must-fail`,
    requirementId: "FR-026" as const,
    acceptanceId: "AC-026" as const,
    target: "audit_logs" as const,
    missingField: field,
    expectedDecision: "require_audit" as const,
  })),
  ...POLICY_SETTINGS_METADATA_REQUIRED_FIELDS.map((field) => ({
    traceId: `FNC-013/FR-026/AC-026/policy_settings/metadata_json/missing-${field}-must-fail`,
    requirementId: "FR-026" as const,
    acceptanceId: "AC-026" as const,
    target: "policy_settings" as const,
    missingField: field,
    expectedDecision: "require_audit" as const,
  })),
];
