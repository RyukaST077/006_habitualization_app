import type { CoreTableName } from "../helpers/schema-introspection";

export type ConsentAuditTableName = "policy_settings" | "policy_consents" | "audit_logs";

export interface ConsentAuditTableDdlExpectation {
  traceId: "TBL-006" | "TBL-007" | "TBL-008";
  tableName: ConsentAuditTableName;
  requiredColumns: string[];
  requiredConstraints: string[];
  requiredIndexes: string[];
  requiredTriggers: string[];
  requiredRlsEnabled: boolean;
  requiredRlsPolicyNames: string[];
  requiredRlsUsingExpressions: string[];
}

export interface PolicyConsentUniqueRedCase {
  traceId: string;
  tableName: "policy_consents";
  constraintName: string;
  columns: string[];
  featureRequirement: "FR-005";
}

export interface PolicyTypeConstraintCase {
  traceId: string;
  tableName: "policy_settings" | "policy_consents";
  constraintName: "chk_policy_settings_type" | "chk_policy_consents_type";
  requiredDefinitionFragments: string[];
}

export interface PolicySettingsServiceRoleUpdateCase {
  traceId: string;
  tableName: "policy_settings";
  requiredRlsEnabled: false;
  expectedRlsPolicyCount: 0;
  requiredTriggerName: "trg_policy_settings_update_audit";
  requiredActorRole: "service_role";
  expectedBehavior: string;
}

export interface PolicyConsentForeignKeyRedCase {
  traceId: string;
  tableName: "policy_consents";
  constraintName: string;
  referencedTable: CoreTableName;
  featureRequirement: "FR-025";
}

export interface PolicyConsentRlsRedCase {
  traceId: string;
  command: "select" | "insert" | "update" | "delete";
  requiredPolicyName: string;
  requiredUsingExpression?: string;
  requiredCheckExpression?: string;
}

export interface PolicyConsentAuditRedCase {
  traceId: string;
  tableName: "policy_consents";
  triggerName: "trg_policy_consents_insert_audit";
  requiredAuditAction: "POLICY_CONSENT_ACCEPT";
  expectedBehavior: string;
}

export interface TriggerRedExpectation {
  traceId: string;
  tableName: CoreTableName;
  triggerName: string;
  expectedBehavior: string;
}

export interface AuditMetadataRedCase {
  traceId: string;
  tableName: "audit_logs";
  constraintName: string;
  requiredDefinitionFragments: string[];
  featureRequirement: "FR-026";
}

export interface AuditLogResultConstraintRedCase {
  traceId: string;
  tableName: "audit_logs";
  constraintName: "chk_audit_logs_result";
  requiredDefinitionFragments: string[];
}

export interface AuditLogRequiredFieldsRedCase {
  traceId: string;
  tableName: "audit_logs";
  constraintName: "chk_audit_logs_required";
  requiredDefinitionFragments: string[];
  requiredColumns: Array<"action" | "target_type" | "target_id">;
}

export const CONSENT_AUDIT_TABLE_DDL_EXPECTATIONS: ConsentAuditTableDdlExpectation[] = [
  {
    traceId: "TBL-006",
    tableName: "policy_settings",
    requiredColumns: [
      "policy_type",
      "current_version",
      "effective_from",
      "document_url",
      "updated_by",
      "updated_at",
      "created_at",
    ],
    requiredConstraints: ["pk_policy_settings", "chk_policy_settings_type"],
    requiredIndexes: ["pk_policy_settings", "idx_policy_settings_updated"],
    requiredTriggers: ["trg_policy_settings_update_audit"],
    requiredRlsEnabled: false,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: [],
  },
  {
    traceId: "TBL-007",
    tableName: "policy_consents",
    requiredColumns: [
      "id",
      "user_id",
      "policy_type",
      "policy_version",
      "consented_at",
      "consent_source",
      "user_agent",
      "created_at",
    ],
    requiredConstraints: [
      "pk_policy_consents",
      "uq_policy_consents_user_type_ver",
      "chk_policy_consents_type",
    ],
    requiredIndexes: [
      "pk_policy_consents",
      "uq_policy_consents_user_type_ver",
      "idx_policy_consents_user_type_time",
    ],
    requiredTriggers: ["trg_policy_consents_insert_audit"],
    requiredRlsEnabled: true,
    requiredRlsPolicyNames: [
      "policy_consents_select_own",
      "policy_consents_insert_own",
      "policy_consents_update_own",
      "policy_consents_delete_own",
    ],
    requiredRlsUsingExpressions: ["auth.uid() = user_id"],
  },
  {
    traceId: "TBL-008",
    tableName: "audit_logs",
    requiredColumns: [
      "id",
      "occurred_at",
      "actor_user_id",
      "actor_role",
      "action",
      "target_type",
      "target_id",
      "result",
      "reason",
      "requirement_id",
      "trace_id",
      "metadata_json",
      "created_at",
    ],
    requiredConstraints: [
      "pk_audit_logs",
      "chk_audit_logs_result",
      "chk_audit_logs_required",
      "chk_audit_logs_policy_settings_metadata",
    ],
    requiredIndexes: [
      "pk_audit_logs",
      "idx_audit_logs_occurred",
      "idx_audit_logs_actor",
      "idx_audit_logs_action_result",
    ],
    requiredTriggers: [],
    requiredRlsEnabled: false,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: [],
  },
];

export const POLICY_CONSENTS_UNIQUE_CASES: PolicyConsentUniqueRedCase[] = [
  {
    traceId: "TBL-007/FR-005/uq_policy_consents_user_type_ver",
    tableName: "policy_consents",
    constraintName: "uq_policy_consents_user_type_ver",
    columns: ["user_id", "policy_type", "policy_version"],
    featureRequirement: "FR-005",
  },
];
export const POLICY_CONSENTS_UNIQUE_RED_CASES = POLICY_CONSENTS_UNIQUE_CASES;

export const POLICY_TYPE_CONSTRAINT_CASES: PolicyTypeConstraintCase[] = [
  {
    traceId: "TBL-006/chk_policy_settings_type",
    tableName: "policy_settings",
    constraintName: "chk_policy_settings_type",
    requiredDefinitionFragments: ["policy_type", "terms", "privacy"],
  },
  {
    traceId: "TBL-007/chk_policy_consents_type",
    tableName: "policy_consents",
    constraintName: "chk_policy_consents_type",
    requiredDefinitionFragments: ["policy_type", "terms", "privacy"],
  },
];

export const POLICY_TYPE_CONSTRAINT_RED_CASES = POLICY_TYPE_CONSTRAINT_CASES;

export const POLICY_SETTINGS_SERVICE_ROLE_UPDATE_CASES: PolicySettingsServiceRoleUpdateCase[] =
  [
    {
      traceId: "TBL-006/FR-026/policy-settings-service-role-update",
      tableName: "policy_settings",
      requiredRlsEnabled: false,
      expectedRlsPolicyCount: 0,
      requiredTriggerName: "trg_policy_settings_update_audit",
      requiredActorRole: "service_role",
      expectedBehavior: "policy_settings の更新は service role 前提で監査トリガーが有効である",
    },
  ];

export const POLICY_SETTINGS_SERVICE_ROLE_UPDATE_RED_CASES =
  POLICY_SETTINGS_SERVICE_ROLE_UPDATE_CASES;

export const POLICY_CONSENTS_FK_CASES: PolicyConsentForeignKeyRedCase[] = [
  {
    traceId: "TBL-007/FR-025/fk_policy_consents_user",
    tableName: "policy_consents",
    constraintName: "fk_policy_consents_user",
    referencedTable: "profiles",
    featureRequirement: "FR-025",
  },
  {
    traceId: "TBL-007/FR-025/fk_policy_consents_type",
    tableName: "policy_consents",
    constraintName: "fk_policy_consents_type",
    referencedTable: "policy_settings",
    featureRequirement: "FR-025",
  },
];
export const POLICY_CONSENTS_FK_RED_CASES = POLICY_CONSENTS_FK_CASES;

export const POLICY_CONSENTS_RLS_CASES: PolicyConsentRlsRedCase[] = [
  {
    traceId: "TBL-007/RLS/select-own",
    command: "select",
    requiredPolicyName: "policy_consents_select_own",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-007/RLS/insert-own",
    command: "insert",
    requiredPolicyName: "policy_consents_insert_own",
    requiredCheckExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-007/RLS/update-own",
    command: "update",
    requiredPolicyName: "policy_consents_update_own",
    requiredUsingExpression: "auth.uid() = user_id",
    requiredCheckExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-007/RLS/delete-own",
    command: "delete",
    requiredPolicyName: "policy_consents_delete_own",
    requiredUsingExpression: "auth.uid() = user_id",
  },
];
export const POLICY_CONSENTS_RLS_RED_CASES = POLICY_CONSENTS_RLS_CASES;

export const POLICY_CONSENT_AUDIT_CASES: PolicyConsentAuditRedCase[] = [
  {
    traceId: "TBL-007/FR-026/POLICY_CONSENT_ACCEPT",
    tableName: "policy_consents",
    triggerName: "trg_policy_consents_insert_audit",
    requiredAuditAction: "POLICY_CONSENT_ACCEPT",
    expectedBehavior: "同意受諾時に POLICY_CONSENT_ACCEPT 監査イベントを出力する",
  },
];
export const POLICY_CONSENT_AUDIT_RED_CASES = POLICY_CONSENT_AUDIT_CASES;

export const CONSENT_AUDIT_TRIGGER_RED_EXPECTATIONS: TriggerRedExpectation[] = [
  {
    traceId: "TBL-006/FR-026/policy_settings-update-audit",
    tableName: "policy_settings",
    triggerName: "trg_policy_settings_update_audit",
    expectedBehavior: "policy_settings 更新時に監査ログへ旧版/新版差分を記録する",
  },
  {
    traceId: "TBL-007/FR-026/policy_consents-insert-audit",
    tableName: "policy_consents",
    triggerName: "trg_policy_consents_insert_audit",
    expectedBehavior: "policy_consents insert 時に POLICY_CONSENT_ACCEPT 監査を記録する",
  },
];

export const AUDIT_METADATA_REQUIRED_RED_CASES: AuditMetadataRedCase[] = [
  {
    traceId: "IF-004/FR-026/policy-settings-version-diff-metadata",
    tableName: "audit_logs",
    constraintName: "chk_audit_logs_policy_settings_metadata",
    requiredDefinitionFragments: ["metadata_json", "old_version", "new_version", "policy_type"],
    featureRequirement: "FR-026",
  },
];

export const AUDIT_LOG_RESULT_CONSTRAINT_RED_CASES: AuditLogResultConstraintRedCase[] = [
  {
    traceId: "TBL-008/chk_audit_logs_result",
    tableName: "audit_logs",
    constraintName: "chk_audit_logs_result",
    requiredDefinitionFragments: ["result", "success", "failure"],
  },
];

export const AUDIT_LOG_REQUIRED_FIELDS_RED_CASES: AuditLogRequiredFieldsRedCase[] = [
  {
    traceId: "TBL-008/chk_audit_logs_required",
    tableName: "audit_logs",
    constraintName: "chk_audit_logs_required",
    requiredDefinitionFragments: ["action", "target_type", "target_id", "is not null"],
    requiredColumns: ["action", "target_type", "target_id"],
  },
];
