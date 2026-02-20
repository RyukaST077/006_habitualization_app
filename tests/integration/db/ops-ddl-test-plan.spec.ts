import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ACCOUNT_DELETION_JOBS_SLA_RETRY_RED_CASES,
  ACCOUNT_DELETION_JOBS_STATUS_CHECK_RED_CASES,
  ACCOUNT_DELETION_JOBS_UNIQUE_RED_CASES,
  MONITORING_ALERT_EVENTS_LEVEL_CHECK_RED_CASES,
  MONITORING_ALERT_EVENTS_NOTIFICATION_TRACKING_RED_CASES,
  MONITORING_ALERT_EVENTS_STATUS_CHECK_RED_CASES,
  OPS_CLI_SQL_COMPATIBILITY_CASES,
  OPS_FAILED_TRACKING_CASES,
  OPS_P2_DEFAULT_DISABLED_CASES,
  OPS_SLA_COLUMN_CASES,
  OPS_TABLE_DDL_EXPECTATIONS,
} from "./fixtures/ops-ddl-tables";

const initSql = readFileSync("supabase/migrations/00000000000000_init.sql", "utf8");
const normalizedInitSql = initSql.toLowerCase();
const REQUIRED_FEATURE_TRACES = ["FR-023", "FR-024", "FR-018"] as const;

function getPolicyStatement(tableName: string, policyName: string): string | null {
  const match = normalizedInitSql.match(
    new RegExp(`create policy\\s+${policyName}\\s+on\\s+public\\.${tableName}[\\s\\S]*?;`),
  );
  return match?.[0] ?? null;
}

describe("T-022 PR-001 ops DDL test plan", () => {
  it.each(OPS_TABLE_DDL_EXPECTATIONS)(
    "$traceId $tableName: カラム/制約/インデックス/RLS/トリガー要件を満たす",
    async (expected) => {
      const tableCreatePrefix = `create table if not exists ${expected.tableName}`;

      expect(normalizedInitSql).toContain(tableCreatePrefix);
      expected.requiredColumns.forEach((column) => {
        expect(normalizedInitSql).toContain(column);
      });
      expected.requiredConstraints.forEach((constraint) => {
        expect(normalizedInitSql).toContain(`constraint ${constraint.toLowerCase()}`);
      });
      expected.requiredIndexes.forEach((indexName) => {
        if (!indexName.startsWith("pk_")) {
          expect(normalizedInitSql).toContain(indexName.toLowerCase());
        }
      });
      expected.requiredTriggers.forEach((triggerName) => {
        expect(normalizedInitSql).toContain(`create or replace trigger ${triggerName.toLowerCase()}`);
      });

      const hasRlsEnable = normalizedInitSql.includes(
        `alter table public.${expected.tableName} enable row level security`,
      );
      expect(hasRlsEnable).toBe(expected.requiredRlsEnabled);
      expected.requiredRlsPolicyNames.forEach((policyName) => {
        const policySql = getPolicyStatement(expected.tableName, policyName);
        expect(policySql, `${expected.traceId}: policy ${policyName} が必要`).toBeTruthy();
      });
      expected.requiredRlsUsingExpressions.forEach((expression) => {
        expect(normalizedInitSql).toContain(expression.toLowerCase());
      });
    },
  );

  it.each(OPS_SLA_COLUMN_CASES)(
    "$traceId: 退会SLA期限列と既定値を満たす",
    async (redCase) => {
      expect(normalizedInitSql).toContain(`create table if not exists ${redCase.tableName}`);
      redCase.requiredColumns.forEach((column) => {
        expect(normalizedInitSql).toContain(column);
      });
      redCase.requiredDefaultFragments.forEach((fragment) => {
        expect(normalizedInitSql).toContain(fragment.toLowerCase());
      });
    },
  );

  it.each(OPS_FAILED_TRACKING_CASES)(
    "$traceId: failed追跡列と状態制約を満たす",
    async (redCase) => {
      expect(normalizedInitSql).toContain(`create table if not exists ${redCase.tableName}`);
      redCase.requiredColumns.forEach((column) => {
        expect(normalizedInitSql).toContain(column);
      });
      expect(normalizedInitSql).toContain(`constraint ${redCase.requiredConstraintName.toLowerCase()} check`);
      redCase.requiredConstraintFragments.forEach((fragment) => {
        expect(normalizedInitSql).toContain(fragment.toLowerCase());
      });
    },
  );

  it.each(OPS_P2_DEFAULT_DISABLED_CASES)(
    "$traceId: P2既定無効かつ通知状態追跡を満たす",
    async (redCase) => {
      expect(normalizedInitSql).toContain(`create table if not exists ${redCase.tableName}`);
      expect(normalizedInitSql).toContain(
        `constraint ${redCase.alertLevelConstraintName.toLowerCase()} check`,
      );
      redCase.requiredAlertLevelValues.forEach((alertLevel) => {
        expect(normalizedInitSql).toContain(alertLevel.toLowerCase());
      });
      expect(normalizedInitSql.includes(`default '${redCase.forbiddenDefaultValue.toLowerCase()}'`)).toBe(
        false,
      );
      expect(normalizedInitSql).toContain(
        `constraint ${redCase.requiredStatusConstraintName.toLowerCase()} check`,
      );
      redCase.requiredStatusValues.forEach((status) => {
        expect(normalizedInitSql).toContain(status.toLowerCase());
      });
    },
  );

  it.each(OPS_CLI_SQL_COMPATIBILITY_CASES)(
    "$traceId: IF-005運用SQLが前提とする列要件を満たす",
    async (redCase) => {
      expect(normalizedInitSql).toContain(`create table if not exists ${redCase.tableName}`);
      redCase.requiredColumns.forEach((column) => {
        expect(normalizedInitSql).toContain(column);
      });
      (redCase.forbiddenColumns ?? []).forEach((column) => {
        expect(normalizedInitSql.includes(`${column.toLowerCase()} `)).toBe(false);
      });
    },
  );

  it("TBL-009/TBL-010: FR-023/FR-024/FR-018 のトレース観点を保持する", async () => {
    const featureRequirements = [
      ...ACCOUNT_DELETION_JOBS_UNIQUE_RED_CASES.map((redCase) => redCase.featureRequirement),
      ...ACCOUNT_DELETION_JOBS_STATUS_CHECK_RED_CASES.map((redCase) => redCase.featureRequirement),
      ...ACCOUNT_DELETION_JOBS_SLA_RETRY_RED_CASES.map((redCase) => redCase.featureRequirement),
      ...MONITORING_ALERT_EVENTS_LEVEL_CHECK_RED_CASES.map((redCase) => redCase.featureRequirement),
      ...MONITORING_ALERT_EVENTS_STATUS_CHECK_RED_CASES.map((redCase) => redCase.featureRequirement),
      ...MONITORING_ALERT_EVENTS_NOTIFICATION_TRACKING_RED_CASES.map(
        (redCase) => redCase.featureRequirement,
      ),
    ];

    REQUIRED_FEATURE_TRACES.forEach((requiredTrace) => {
      expect(featureRequirements).toContain(requiredTrace);
    });
  });
});
