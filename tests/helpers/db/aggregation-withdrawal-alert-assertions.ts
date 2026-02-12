import { expect } from 'vitest';

import {
  hasConstraintName,
  hasCreateTable,
  hasDdlMatcher,
  hasIndexName,
} from './schema-introspection';
import { expectRoleRestrictedReadRls, expectUserScopedRls } from './rls-assertions';

export function expectAggregationWithdrawalAlertTable(sql: string, tableName: string): void {
  expect(hasCreateTable(sql, tableName)).toBe(true);
}

export function expectAggregationWithdrawalAlertConstraint(
  sql: string,
  constraintName: string,
): void {
  expect(hasConstraintName(sql, constraintName)).toBe(true);
}

export function expectAggregationWithdrawalAlertIndex(sql: string, indexName: string): void {
  expect(hasIndexName(sql, indexName)).toBe(true);
}

export function expectAggregationUserScopedRls(sql: string): void {
  expectUserScopedRls(sql, 'user_daily_activity');
}

export function expectAggregationKpiRoleRestrictedRls(sql: string): void {
  expectRoleRestrictedReadRls(sql, 'analytics_daily_kpi');
}

export function expectAccountDeletionLifecycleTokens(sql: string): void {
  expect(hasDdlMatcher(sql, /queued/i)).toBe(true);
  expect(hasDdlMatcher(sql, /in_progress/i)).toBe(true);
  expect(hasDdlMatcher(sql, /completed/i)).toBe(true);
  expect(hasDdlMatcher(sql, /failed/i)).toBe(true);
}

export function expectAccountDeletionSlaDefaults(sql: string): void {
  expect(
    hasDdlMatcher(
      sql,
      /disable_due_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)\s*\+\s*interval\s+'60 second'/i,
    ),
  ).toBe(true);
  expect(
    hasDdlMatcher(
      sql,
      /hard_delete_due_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)\s*\+\s*interval\s+'5 minute'/i,
    ),
  ).toBe(true);
}

export function expectMonitoringAlertStateTokens(sql: string): void {
  expect(hasDdlMatcher(sql, /pending/i)).toBe(true);
  expect(hasDdlMatcher(sql, /sent/i)).toBe(true);
  expect(hasDdlMatcher(sql, /failed/i)).toBe(true);
}

export function expectP2OptInMarker(sql: string): void {
  expect(hasDdlMatcher(sql, /P2/i)).toBe(true);
  expect(hasDdlMatcher(sql, /既定無効|default.*disabled|opt-?in/i)).toBe(true);
}

export function expectNoPersonalIdentifierColumns(sql: string): void {
  const analyticsTable = sql.match(/create\s+table\s+analytics_daily_kpi\s*\(([\s\S]*?)\);/i);
  const analyticsColumns = analyticsTable?.[1] ?? '';
  expect(hasDdlMatcher(analyticsColumns, /user_id|email/i)).toBe(false);
}
