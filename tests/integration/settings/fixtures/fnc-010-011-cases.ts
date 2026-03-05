export type SettingsRequirementId = "FR-019" | "FR-020" | "FR-021" | "FR-022";
export type SettingsAcceptanceId = "AC-019" | "AC-020" | "AC-021" | "AC-022";
export type SettingsCaseId =
  | "TC-IT-FR-019-001"
  | "TC-IT-FR-020-002"
  | "TC-IT-FR-021-003"
  | "TC-IT-FR-021-004"
  | "TC-IT-FR-022-001"
  | "TC-IT-FR-022-002";
export type SettingsBoundary = "IF-002" | "IF-005" | "M-008" | "M-010" | "TBL-001" | "TBL-008";
export type SettingsPerspective =
  | "TZ_UPDATE_PERSISTENCE"
  | "CUTOFF_EFFECTIVE_AFTER_CHANGE"
  | "VALIDATION_INVALID_TIMEZONE"
  | "VALIDATION_INVALID_CUTOFF"
  | "AUDIT_TZ_UPDATE"
  | "AUDIT_CUTOFF_UPDATE";

export interface SettingsCaseDefinition {
  traceId: string;
  testCaseId: SettingsCaseId;
  requirementId: SettingsRequirementId;
  acceptanceId: SettingsAcceptanceId;
  boundary: SettingsBoundary;
  perspective: SettingsPerspective;
  endpoint: "/api/settings/profile";
  method: "GET" | "PATCH";
  title: string;
  notes: string;
  scope: {
    ownerTask: "T-028";
    excludedTasks: readonly ["T-056", "T-029"];
    excludedEndpoints: readonly ["/api/settings/withdrawal"];
  };
}

export const SETTINGS_REQUIRED_REQUIREMENT_IDS: readonly SettingsRequirementId[] = [
  "FR-019",
  "FR-020",
  "FR-021",
  "FR-022",
];

export const SETTINGS_REQUIRED_ACCEPTANCE_IDS: readonly SettingsAcceptanceId[] = [
  "AC-019",
  "AC-020",
  "AC-021",
  "AC-022",
];

export const SETTINGS_REQUIRED_CASE_IDS: readonly SettingsCaseId[] = [
  "TC-IT-FR-019-001",
  "TC-IT-FR-020-002",
  "TC-IT-FR-021-003",
  "TC-IT-FR-021-004",
  "TC-IT-FR-022-001",
  "TC-IT-FR-022-002",
];

export const SETTINGS_REQUIRED_PERSPECTIVES: readonly SettingsPerspective[] = [
  "TZ_UPDATE_PERSISTENCE",
  "CUTOFF_EFFECTIVE_AFTER_CHANGE",
  "VALIDATION_INVALID_TIMEZONE",
  "VALIDATION_INVALID_CUTOFF",
  "AUDIT_TZ_UPDATE",
  "AUDIT_CUTOFF_UPDATE",
];

export const SETTINGS_SCOPE_EXCLUDED_TASKS = ["T-056", "T-029"] as const;
export const SETTINGS_SCOPE_EXCLUDED_ENDPOINTS = ["/api/settings/withdrawal"] as const;

export const SETTINGS_PLAN_COMMAND =
  "npm run test -- tests/integration/settings/fnc-010-011-test-plan.spec.ts";

export const SETTINGS_PLAN_CASES: readonly SettingsCaseDefinition[] = [
  {
    traceId: "T-028/C-001/FNC-010/TC-IT-FR-019-001/FR-019/AC-019/tz-update-persistence",
    testCaseId: "TC-IT-FR-019-001",
    requirementId: "FR-019",
    acceptanceId: "AC-019",
    boundary: "IF-002",
    perspective: "TZ_UPDATE_PERSISTENCE",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "TZ変更が保存され再表示時に反映される",
    notes: "FR-019 AC-019 IF-002 M-008 timezone update persistence and profile reload reflection",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
  {
    traceId: "T-028/C-001/FNC-010/TC-IT-FR-020-002/FR-020/AC-020/cutoff-effective-after-change",
    testCaseId: "TC-IT-FR-020-002",
    requirementId: "FR-020",
    acceptanceId: "AC-020",
    boundary: "TBL-001",
    perspective: "CUTOFF_EFFECTIVE_AFTER_CHANGE",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "締め時刻変更は変更以降のデータのみに適用される",
    notes:
      "FR-020 AC-020 TBL-001 M-008 effective_from only applies after change and must not recompute past logs",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
  {
    traceId: "T-028/C-001/FNC-010/TC-IT-FR-021-003/FR-021/AC-021/invalid-timezone-validation",
    testCaseId: "TC-IT-FR-021-003",
    requirementId: "FR-021",
    acceptanceId: "AC-021",
    boundary: "M-008",
    perspective: "VALIDATION_INVALID_TIMEZONE",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "不正TZは VALIDATION_ERROR で拒否される",
    notes: "FR-021 AC-021 M-008 IF-002 invalid timezone rejected and profile remains unchanged",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
  {
    traceId: "T-028/C-001/FNC-010/TC-IT-FR-021-004/FR-021/AC-021/invalid-cutoff-validation",
    testCaseId: "TC-IT-FR-021-004",
    requirementId: "FR-021",
    acceptanceId: "AC-021",
    boundary: "M-008",
    perspective: "VALIDATION_INVALID_CUTOFF",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "不正締め時刻形式は VALIDATION_ERROR で拒否される",
    notes: "FR-021 AC-021 M-008 IF-002 invalid cutoff format like 24:00 must be rejected",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
  {
    traceId: "T-028/C-001/FNC-011/TC-IT-FR-022-001/FR-022/AC-022/audit-on-timezone-update",
    testCaseId: "TC-IT-FR-022-001",
    requirementId: "FR-022",
    acceptanceId: "AC-022",
    boundary: "TBL-008",
    perspective: "AUDIT_TZ_UPDATE",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "TZ変更時に SETTINGS_UPDATE 監査必須項目が記録される",
    notes:
      "FR-022 AC-022 TBL-008 M-010 SETTINGS_UPDATE audit contains actor_user_id occurred_at action target_id result trace_id",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
  {
    traceId: "T-028/C-001/FNC-011/TC-IT-FR-022-002/FR-022/AC-022/audit-on-cutoff-update",
    testCaseId: "TC-IT-FR-022-002",
    requirementId: "FR-022",
    acceptanceId: "AC-022",
    boundary: "IF-005",
    perspective: "AUDIT_CUTOFF_UPDATE",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    title: "締め時刻変更時の監査ログが RPT-002 抽出互換を維持する",
    notes:
      "FR-022 AC-022 IF-005 TBL-008 RPT-002 columns action target_id result requirement_id trace_id remain queryable",
    scope: {
      ownerTask: "T-028",
      excludedTasks: SETTINGS_SCOPE_EXCLUDED_TASKS,
      excludedEndpoints: SETTINGS_SCOPE_EXCLUDED_ENDPOINTS,
    },
  },
] as const;
