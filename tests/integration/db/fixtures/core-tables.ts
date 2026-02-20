import type { CoreTableName } from "../helpers/schema-introspection";

export interface CoreTableDdlExpectation {
  traceId: "TBL-001" | "TBL-002" | "TBL-003";
  tableName: CoreTableName;
  requiredColumns: string[];
  requiredConstraints: string[];
  requiredIndexes: string[];
  requiredTriggers: string[];
  requiredRlsUsingExpressions: string[];
}

export interface DdlConstraintRedCase {
  traceId: string;
  invalidValue: string;
  expectedConstraint: string;
}

export interface TriggerRedExpectation {
  traceId: string;
  triggerName: string;
  expectedBehavior: string;
}

export interface RlsPolicyRedCase {
  traceId: string;
  command: "select" | "insert" | "update" | "delete";
  actor: "owner" | "other_user" | "anonymous";
  expectedDecision: "allow" | "deny";
  requiredUsingExpression: string;
}

export interface UniqueConstraintRedCase {
  traceId: string;
  tableName: CoreTableName;
  constraintName: string;
  columns: string[];
  featureRequirement: "FR-012";
}

export interface ForeignKeyRedCase {
  traceId: string;
  tableName: CoreTableName;
  constraintName: string;
  referencedTable: string;
  featureRequirement: "FR-025";
}

export interface ActiveHabitValidationRedCase {
  traceId: string;
  triggerName: string;
  invalidHabitStatus: "archived";
  expectedBehavior: string;
  featureRequirement: "FR-013";
}

export const CORE_TABLE_DDL_EXPECTATIONS: CoreTableDdlExpectation[] = [
  {
    traceId: "TBL-001",
    tableName: "profiles",
    requiredColumns: ["user_id", "timezone", "day_cutoff_time", "account_status", "updated_at"],
    requiredConstraints: ["chk_profiles_timezone", "chk_profiles_cutoff"],
    requiredIndexes: ["pk_profiles", "idx_profiles_status", "idx_profiles_updated_at"],
    requiredTriggers: ["trg_profiles_updated_at"],
    requiredRlsUsingExpressions: ["auth.uid() = user_id"],
  },
  {
    traceId: "TBL-002",
    tableName: "habits",
    requiredColumns: ["id", "user_id", "name", "status", "archived_at", "updated_at"],
    requiredConstraints: ["chk_habits_status", "chk_habits_name_len"],
    requiredIndexes: ["pk_habits", "idx_habits_user_status_order", "idx_habits_user_updated"],
    requiredTriggers: ["trg_habits_archive"],
    requiredRlsUsingExpressions: ["auth.uid() = user_id"],
  },
  {
    traceId: "TBL-003",
    tableName: "habit_logs",
    requiredColumns: ["id", "user_id", "habit_id", "log_date", "checked_in_at", "updated_at"],
    requiredConstraints: ["fk_habit_logs_habit", "uq_habit_logs_habit_date"],
    requiredIndexes: ["pk_habit_logs", "uq_habit_logs_habit_date", "idx_habit_logs_user_date", "idx_habit_logs_habit_date"],
    requiredTriggers: ["trg_habit_logs_validate_active", "trg_habit_logs_updated_at"],
    requiredRlsUsingExpressions: ["auth.uid() = user_id"],
  },
];

export const PROFILE_DDL_CONSTRAINT_RED_CASES: DdlConstraintRedCase[] = [
  {
    traceId: "TBL-001/FR-010-timezone",
    invalidValue: "Mars/Phobos",
    expectedConstraint: "chk_profiles_timezone",
  },
  {
    traceId: "TBL-001/FR-010-day-cutoff",
    invalidValue: "24:00:00",
    expectedConstraint: "chk_profiles_cutoff",
  },
  {
    traceId: "TBL-001/FR-010-account-status",
    invalidValue: "suspended",
    expectedConstraint: "chk_profiles_account_status",
  },
];

export const HABIT_DDL_CONSTRAINT_RED_CASES: DdlConstraintRedCase[] = [
  {
    traceId: "TBL-002/FR-016-status",
    invalidValue: "paused",
    expectedConstraint: "chk_habits_status",
  },
  {
    traceId: "TBL-002/FR-016-name-empty",
    invalidValue: "",
    expectedConstraint: "chk_habits_name_len",
  },
  {
    traceId: "TBL-002/FR-016-name-over-80",
    invalidValue: "x".repeat(81),
    expectedConstraint: "chk_habits_name_len",
  },
];

export const PROFILE_TRIGGER_RED_EXPECTATIONS: TriggerRedExpectation[] = [
  {
    traceId: "TBL-001/updated-at-trigger",
    triggerName: "trg_profiles_updated_at",
    expectedBehavior: "UPDATE 時に updated_at を now() へ更新する",
  },
];

export const HABIT_TRIGGER_RED_EXPECTATIONS: TriggerRedExpectation[] = [
  {
    traceId: "TBL-002/archive-trigger",
    triggerName: "trg_habits_archive",
    expectedBehavior: "status='archived' への更新時に archived_at を now() へ更新する",
  },
];

export const PROFILE_RLS_RED_CASES: RlsPolicyRedCase[] = [
  {
    traceId: "TBL-001/RLS/select-owner",
    command: "select",
    actor: "owner",
    expectedDecision: "allow",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-001/RLS/update-other-user",
    command: "update",
    actor: "other_user",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-001/RLS/select-anonymous",
    command: "select",
    actor: "anonymous",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
];

export const HABIT_RLS_RED_CASES: RlsPolicyRedCase[] = [
  {
    traceId: "TBL-002/RLS/select-owner",
    command: "select",
    actor: "owner",
    expectedDecision: "allow",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-002/RLS/delete-other-user",
    command: "delete",
    actor: "other_user",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-002/RLS/insert-anonymous",
    command: "insert",
    actor: "anonymous",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
];

export const HABIT_LOG_UNIQUE_RED_CASES: UniqueConstraintRedCase[] = [
  {
    traceId: "TBL-003/FR-012/uq_habit_logs_habit_date",
    tableName: "habit_logs",
    constraintName: "uq_habit_logs_habit_date",
    columns: ["habit_id", "log_date"],
    featureRequirement: "FR-012",
  },
];

export const HABIT_LOG_FK_RED_CASES: ForeignKeyRedCase[] = [
  {
    traceId: "TBL-003/FR-025/fk_habit_logs_habit",
    tableName: "habit_logs",
    constraintName: "fk_habit_logs_habit",
    referencedTable: "habits",
    featureRequirement: "FR-025",
  },
];

export const HABIT_LOG_ACTIVE_VALIDATION_RED_CASES: ActiveHabitValidationRedCase[] = [
  {
    traceId: "TBL-003/FR-013/validate_active",
    triggerName: "trg_habit_logs_validate_active",
    invalidHabitStatus: "archived",
    expectedBehavior: "archived習慣へのINSERTを拒否する",
    featureRequirement: "FR-013",
  },
];

export const HABIT_LOG_RLS_RED_CASES: RlsPolicyRedCase[] = [
  {
    traceId: "TBL-003/RLS/select-owner",
    command: "select",
    actor: "owner",
    expectedDecision: "allow",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-003/RLS/insert-other-user",
    command: "insert",
    actor: "other_user",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
  {
    traceId: "TBL-003/RLS/delete-anonymous",
    command: "delete",
    actor: "anonymous",
    expectedDecision: "deny",
    requiredUsingExpression: "auth.uid() = user_id",
  },
];
