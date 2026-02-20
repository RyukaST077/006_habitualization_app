import type { CoreTableName } from "../helpers/schema-introspection";

export type OpsTableName =
  | "user_daily_activity"
  | "analytics_daily_kpi"
  | "account_deletion_jobs"
  | "monitoring_alert_events";

export interface OpsTableDdlExpectation {
  traceId: "TBL-004" | "TBL-005" | "TBL-009" | "TBL-010";
  tableName: OpsTableName;
  requiredColumns: string[];
  requiredConstraints: string[];
  requiredIndexes: string[];
  requiredTriggers: string[];
  requiredRlsEnabled: boolean;
  requiredRlsPolicyNames: string[];
  requiredRlsUsingExpressions: string[];
}

export interface OpsSlaColumnCase {
  traceId: string;
  tableName: "account_deletion_jobs";
  requiredColumns: Array<"disable_due_at" | "hard_delete_due_at">;
  requiredDefaultFragments: string[];
  featureRequirement: "FR-023";
  moduleRequirement: "M-009";
}

export interface OpsFailedTrackingCase {
  traceId: string;
  tableName: "account_deletion_jobs" | "monitoring_alert_events";
  requiredColumns: string[];
  requiredConstraintName: string;
  requiredConstraintFragments: string[];
  interfaceRequirement: "IF-003" | "IF-005";
  moduleRequirement: "M-009" | "M-012";
}

export interface OpsP2DefaultDisabledCase {
  traceId: string;
  tableName: "monitoring_alert_events";
  alertLevelConstraintName: "chk_monitoring_alert_events_level";
  requiredAlertLevelValues: Array<"P1" | "P2">;
  forbiddenDefaultValue: "P2";
  requiredStatusConstraintName: "chk_monitoring_alert_events_status";
  requiredStatusValues: Array<"pending" | "sent" | "failed">;
  interfaceRequirement: "IF-003";
  moduleRequirement: "M-012";
}

export interface OpsCliSqlCompatibilityCase {
  traceId: string;
  tableName: "analytics_daily_kpi" | "account_deletion_jobs";
  requiredColumns: string[];
  forbiddenColumns?: string[];
  interfaceRequirement: "IF-005";
  moduleRequirement: "M-011" | "M-009";
}

export interface AccountDeletionJobsUniqueRedCase {
  traceId: string;
  tableName: "account_deletion_jobs";
  constraintName: "uq_account_deletion_jobs_user";
  columns: ["user_id"];
  featureRequirement: "FR-023";
}

export interface AccountDeletionJobsStatusCheckRedCase {
  traceId: string;
  tableName: "account_deletion_jobs";
  constraintName: "chk_account_deletion_jobs_status";
  requiredDefinitionFragments: string[];
  featureRequirement: "FR-023";
}

export interface AccountDeletionJobsSlaRetryRedCase {
  traceId: string;
  tableName: "account_deletion_jobs";
  requiredColumns: Array<"disable_due_at" | "hard_delete_due_at" | "retry_count" | "last_error">;
  featureRequirement: "FR-023";
}

export interface MonitoringAlertEventsLevelCheckRedCase {
  traceId: string;
  tableName: "monitoring_alert_events";
  constraintName: "chk_monitoring_alert_events_level";
  requiredDefinitionFragments: string[];
  featureRequirement: "FR-024";
}

export interface MonitoringAlertEventsStatusCheckRedCase {
  traceId: string;
  tableName: "monitoring_alert_events";
  constraintName: "chk_monitoring_alert_events_status";
  requiredDefinitionFragments: string[];
  featureRequirement: "FR-018";
}

export interface MonitoringAlertEventsIndexRedCase {
  traceId: string;
  tableName: "monitoring_alert_events";
  requiredIndexes: Array<
    "idx_monitoring_alert_events_status" | "idx_monitoring_alert_events_level_time"
  >;
  featureRequirement: "FR-024";
}

export interface MonitoringAlertEventsNotificationTrackingRedCase {
  traceId: string;
  tableName: "monitoring_alert_events";
  requiredColumns: Array<"notification_status" | "error_message">;
  featureRequirement: "FR-018";
}

export const OPS_TABLE_DDL_EXPECTATIONS: OpsTableDdlExpectation[] = [
  {
    traceId: "TBL-004",
    tableName: "user_daily_activity",
    requiredColumns: [
      "id",
      "user_id",
      "activity_date",
      "login_count",
      "checkin_count",
      "timezone_snapshot",
      "cutoff_snapshot",
      "aggregated_at",
      "created_at",
      "updated_at",
    ],
    requiredConstraints: [
      "pk_user_daily_activity",
      "uq_user_daily_activity_user_date",
      "chk_user_daily_activity_counts",
    ],
    requiredIndexes: [
      "pk_user_daily_activity",
      "uq_user_daily_activity_user_date",
      "idx_user_daily_activity_date",
    ],
    requiredTriggers: ["trg_user_daily_activity_upsert"],
    requiredRlsEnabled: true,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: ["auth.uid() = user_id"],
  },
  {
    traceId: "TBL-005",
    tableName: "analytics_daily_kpi",
    requiredColumns: [
      "id",
      "metric_date",
      "metric_key",
      "metric_value",
      "dimension_json",
      "dimension_hash",
      "aggregated_at",
      "created_at",
    ],
    requiredConstraints: [
      "pk_analytics_daily_kpi",
      "uq_analytics_daily_kpi_key",
      "chk_analytics_daily_kpi_non_negative",
    ],
    requiredIndexes: [
      "pk_analytics_daily_kpi",
      "uq_analytics_daily_kpi_key",
      "idx_analytics_daily_kpi_date_key",
    ],
    requiredTriggers: ["trg_analytics_daily_kpi_upsert"],
    requiredRlsEnabled: false,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: [],
  },
  {
    traceId: "TBL-009",
    tableName: "account_deletion_jobs",
    requiredColumns: [
      "id",
      "user_id",
      "job_status",
      "requested_at",
      "disable_due_at",
      "disabled_at",
      "hard_delete_due_at",
      "hard_deleted_at",
      "retry_count",
      "last_error",
      "created_at",
      "updated_at",
    ],
    requiredConstraints: [
      "pk_account_deletion_jobs",
      "uq_account_deletion_jobs_user",
      "chk_account_deletion_jobs_status",
    ],
    requiredIndexes: [
      "pk_account_deletion_jobs",
      "uq_account_deletion_jobs_user",
      "idx_account_deletion_jobs_status_due",
    ],
    requiredTriggers: ["trg_account_deletion_jobs_updated_at"],
    requiredRlsEnabled: false,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: [],
  },
  {
    traceId: "TBL-010",
    tableName: "monitoring_alert_events",
    requiredColumns: [
      "id",
      "alert_level",
      "alert_type",
      "threshold_rule",
      "observed_value",
      "window_start_at",
      "window_end_at",
      "notification_target",
      "notification_status",
      "notified_at",
      "error_message",
      "created_at",
    ],
    requiredConstraints: [
      "pk_monitoring_alert_events",
      "chk_monitoring_alert_events_level",
      "chk_monitoring_alert_events_status",
    ],
    requiredIndexes: [
      "pk_monitoring_alert_events",
      "idx_monitoring_alert_events_status",
      "idx_monitoring_alert_events_level_time",
    ],
    requiredTriggers: [],
    requiredRlsEnabled: false,
    requiredRlsPolicyNames: [],
    requiredRlsUsingExpressions: [],
  },
];

export const OPS_SLA_COLUMN_CASES: OpsSlaColumnCase[] = [
  {
    traceId: "TBL-009/IF-005/M-009/SLA-columns",
    tableName: "account_deletion_jobs",
    requiredColumns: ["disable_due_at", "hard_delete_due_at"],
    requiredDefaultFragments: ["interval '60 second'", "interval '5 minute'"],
    featureRequirement: "FR-023",
    moduleRequirement: "M-009",
  },
];

export const OPS_FAILED_TRACKING_CASES: OpsFailedTrackingCase[] = [
  {
    traceId: "TBL-009/IF-005/M-009/failed-tracking",
    tableName: "account_deletion_jobs",
    requiredColumns: ["job_status", "retry_count", "last_error"],
    requiredConstraintName: "chk_account_deletion_jobs_status",
    requiredConstraintFragments: ["queued", "in_progress", "completed", "failed"],
    interfaceRequirement: "IF-005",
    moduleRequirement: "M-009",
  },
  {
    traceId: "TBL-010/IF-003/M-012/failed-tracking",
    tableName: "monitoring_alert_events",
    requiredColumns: ["notification_status", "error_message"],
    requiredConstraintName: "chk_monitoring_alert_events_status",
    requiredConstraintFragments: ["pending", "sent", "failed"],
    interfaceRequirement: "IF-003",
    moduleRequirement: "M-012",
  },
];

export const OPS_P2_DEFAULT_DISABLED_CASES: OpsP2DefaultDisabledCase[] = [
  {
    traceId: "TBL-010/IF-003/M-012/p2-default-disabled",
    tableName: "monitoring_alert_events",
    alertLevelConstraintName: "chk_monitoring_alert_events_level",
    requiredAlertLevelValues: ["P1", "P2"],
    forbiddenDefaultValue: "P2",
    requiredStatusConstraintName: "chk_monitoring_alert_events_status",
    requiredStatusValues: ["pending", "sent", "failed"],
    interfaceRequirement: "IF-003",
    moduleRequirement: "M-012",
  },
];

export const OPS_CLI_SQL_COMPATIBILITY_CASES: OpsCliSqlCompatibilityCase[] = [
  {
    traceId: "TBL-005/IF-005/M-011/anonymous-kpi-columns",
    tableName: "analytics_daily_kpi",
    requiredColumns: ["metric_date", "metric_key", "metric_value", "dimension_json", "dimension_hash"],
    forbiddenColumns: ["user_id", "email"],
    interfaceRequirement: "IF-005",
    moduleRequirement: "M-011",
  },
  {
    traceId: "TBL-009/IF-005/M-009/deletion-tracking-columns",
    tableName: "account_deletion_jobs",
    requiredColumns: [
      "user_id",
      "job_status",
      "requested_at",
      "disabled_at",
      "hard_deleted_at",
      "last_error",
    ],
    interfaceRequirement: "IF-005",
    moduleRequirement: "M-009",
  },
];

export const ACCOUNT_DELETION_JOBS_UNIQUE_RED_CASES: AccountDeletionJobsUniqueRedCase[] = [
  {
    traceId: "TBL-009/FR-023/uq_account_deletion_jobs_user",
    tableName: "account_deletion_jobs",
    constraintName: "uq_account_deletion_jobs_user",
    columns: ["user_id"],
    featureRequirement: "FR-023",
  },
];

export const ACCOUNT_DELETION_JOBS_STATUS_CHECK_RED_CASES: AccountDeletionJobsStatusCheckRedCase[] =
  [
    {
      traceId: "TBL-009/FR-023/chk_account_deletion_jobs_status",
      tableName: "account_deletion_jobs",
      constraintName: "chk_account_deletion_jobs_status",
      requiredDefinitionFragments: ["job_status", "queued", "in_progress", "completed", "failed"],
      featureRequirement: "FR-023",
    },
  ];

export const ACCOUNT_DELETION_JOBS_SLA_RETRY_RED_CASES: AccountDeletionJobsSlaRetryRedCase[] = [
  {
    traceId: "TBL-009/FR-023/sla-and-retry-columns",
    tableName: "account_deletion_jobs",
    requiredColumns: ["disable_due_at", "hard_delete_due_at", "retry_count", "last_error"],
    featureRequirement: "FR-023",
  },
];

export const MONITORING_ALERT_EVENTS_LEVEL_CHECK_RED_CASES: MonitoringAlertEventsLevelCheckRedCase[] =
  [
    {
      traceId: "TBL-010/FR-024/chk_monitoring_alert_events_level",
      tableName: "monitoring_alert_events",
      constraintName: "chk_monitoring_alert_events_level",
      requiredDefinitionFragments: ["alert_level", "p1", "p2"],
      featureRequirement: "FR-024",
    },
  ];

export const MONITORING_ALERT_EVENTS_STATUS_CHECK_RED_CASES: MonitoringAlertEventsStatusCheckRedCase[] =
  [
    {
      traceId: "TBL-010/FR-018/chk_monitoring_alert_events_status",
      tableName: "monitoring_alert_events",
      constraintName: "chk_monitoring_alert_events_status",
      requiredDefinitionFragments: ["notification_status", "pending", "sent", "failed"],
      featureRequirement: "FR-018",
    },
  ];

export const MONITORING_ALERT_EVENTS_INDEX_RED_CASES: MonitoringAlertEventsIndexRedCase[] = [
  {
    traceId: "TBL-010/FR-024/index-ops-query-paths",
    tableName: "monitoring_alert_events",
    requiredIndexes: ["idx_monitoring_alert_events_status", "idx_monitoring_alert_events_level_time"],
    featureRequirement: "FR-024",
  },
];

export const MONITORING_ALERT_EVENTS_NOTIFICATION_TRACKING_RED_CASES: MonitoringAlertEventsNotificationTrackingRedCase[] =
  [
    {
      traceId: "TBL-010/FR-018/notification-retry-tracking",
      tableName: "monitoring_alert_events",
      requiredColumns: ["notification_status", "error_message"],
      featureRequirement: "FR-018",
    },
  ];

export const OPS_FOREIGN_KEY_PARENT_TABLES: Record<OpsTableName, CoreTableName[]> = {
  user_daily_activity: ["profiles"],
  analytics_daily_kpi: [],
  account_deletion_jobs: ["profiles"],
  monitoring_alert_events: [],
};

export interface OpsUniqueConstraintRedCase {
  traceId: string;
  tableName: "user_daily_activity" | "analytics_daily_kpi";
  constraintName: "uq_user_daily_activity_user_date" | "uq_analytics_daily_kpi_key";
  columns: string[];
}

export interface OpsCheckConstraintRedCase {
  traceId: string;
  tableName: "user_daily_activity" | "analytics_daily_kpi";
  constraintName: "chk_user_daily_activity_counts" | "chk_analytics_daily_kpi_non_negative";
  requiredDefinitionFragments: string[];
}

export interface OpsRlsPolicyRedCase {
  traceId: string;
  command: "select" | "insert" | "update" | "delete";
  requiredPolicyName:
    | "user_daily_activity_select_own"
    | "user_daily_activity_insert_own"
    | "user_daily_activity_update_own"
    | "user_daily_activity_delete_own";
  requiredUsingExpression?: "auth.uid() = user_id";
  requiredCheckExpression?: "auth.uid() = user_id";
}

export interface OpsAnonymousKpiColumnRedCase {
  traceId: string;
  tableName: "analytics_daily_kpi";
  forbiddenColumns: Array<"user_id" | "email">;
}

export const USER_DAILY_ACTIVITY_UNIQUE_RED_CASES: OpsUniqueConstraintRedCase[] = [
  {
    traceId: "TBL-004/uq_user_daily_activity_user_date",
    tableName: "user_daily_activity",
    constraintName: "uq_user_daily_activity_user_date",
    columns: ["user_id", "activity_date"],
  },
];

export const USER_DAILY_ACTIVITY_CHECK_RED_CASES: OpsCheckConstraintRedCase[] = [
  {
    traceId: "TBL-004/chk_user_daily_activity_counts",
    tableName: "user_daily_activity",
    constraintName: "chk_user_daily_activity_counts",
    requiredDefinitionFragments: ["login_count", "checkin_count", ">= 0"],
  },
];

export const USER_DAILY_ACTIVITY_RLS_RED_CASES: OpsRlsPolicyRedCase[] = [
  {
    traceId: "TBL-004/RLS/select-owner",
    command: "select",
    requiredPolicyName: "user_daily_activity_select_own",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-004/RLS/insert-owner",
    command: "insert",
    requiredPolicyName: "user_daily_activity_insert_own",
    requiredCheckExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-004/RLS/update-owner",
    command: "update",
    requiredPolicyName: "user_daily_activity_update_own",
    requiredUsingExpression: "auth.uid() = user_id",
    requiredCheckExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-004/RLS/delete-owner",
    command: "delete",
    requiredPolicyName: "user_daily_activity_delete_own",
    requiredUsingExpression: "auth.uid() = user_id",
  },
];

export const ANALYTICS_DAILY_KPI_UNIQUE_RED_CASES: OpsUniqueConstraintRedCase[] = [
  {
    traceId: "TBL-005/uq_analytics_daily_kpi_key",
    tableName: "analytics_daily_kpi",
    constraintName: "uq_analytics_daily_kpi_key",
    columns: ["metric_date", "metric_key", "dimension_hash"],
  },
];

export const ANALYTICS_DAILY_KPI_CHECK_RED_CASES: OpsCheckConstraintRedCase[] = [
  {
    traceId: "TBL-005/chk_analytics_daily_kpi_non_negative",
    tableName: "analytics_daily_kpi",
    constraintName: "chk_analytics_daily_kpi_non_negative",
    requiredDefinitionFragments: ["metric_value", ">= 0"],
  },
];

export const ANALYTICS_DAILY_KPI_ANONYMITY_RED_CASES: OpsAnonymousKpiColumnRedCase[] = [
  {
    traceId: "TBL-005/anonymous-kpi/no-personal-identifiers",
    tableName: "analytics_daily_kpi",
    forbiddenColumns: ["user_id", "email"],
  },
];
