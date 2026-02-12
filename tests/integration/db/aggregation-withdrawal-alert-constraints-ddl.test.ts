import { describe, expect, test } from 'vitest';

import {
  expectAccountDeletionLifecycleTokens,
  expectAggregationWithdrawalAlertConstraint,
  expectAggregationWithdrawalAlertIndex,
  expectNoPersonalIdentifierColumns,
  expectMonitoringAlertStateTokens,
  expectP2OptInMarker,
} from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import {
  hasDdlMatcher,
} from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert constraints/index DDL', () => {
  test('[TBL-004][user_daily_activity] expected check/unique/index and RLS definitions exist', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertConstraint(sql, 'chk_user_daily_activity_counts');
    expectAggregationWithdrawalAlertConstraint(sql, 'uq_user_daily_activity_user_date');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_user_daily_activity_date');
    expect(hasDdlMatcher(sql, /enable\s+row\s+level\s+security/i)).toBe(true);
    expect(hasDdlMatcher(sql, /auth\.uid\(\)\s*=\s*user_id/i)).toBe(true);
  });

  test('[TBL-005][analytics_daily_kpi] expected non-negative/unique/index and role restriction definitions exist', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertConstraint(sql, 'chk_analytics_daily_kpi_non_negative');
    expectAggregationWithdrawalAlertConstraint(sql, 'uq_analytics_daily_kpi_key');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_analytics_daily_kpi_date_key');
    expect(hasDdlMatcher(sql, /role-002|role_002|role002/i)).toBe(true);
    expect(hasDdlMatcher(sql, /service\s+role/i)).toBe(true);
    expectNoPersonalIdentifierColumns(sql);
  });

  test('[TBL-009][account_deletion_jobs] expected status/unique/index and lifecycle markers exist', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertConstraint(sql, 'chk_account_deletion_jobs_status');
    expectAggregationWithdrawalAlertConstraint(sql, 'uq_account_deletion_jobs_user');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_account_deletion_jobs_status_due');
    expect(hasDdlMatcher(sql, /trg_account_deletion_jobs_updated_at/i)).toBe(true);
    expectAccountDeletionLifecycleTokens(sql);
  });

  test('[TBL-010][monitoring_alert_events] expected level/status constraints and indexes exist', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertConstraint(sql, 'chk_monitoring_alert_events_level');
    expectAggregationWithdrawalAlertConstraint(sql, 'chk_monitoring_alert_events_status');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_monitoring_alert_events_status');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_monitoring_alert_events_level_time');
    expect(hasDdlMatcher(sql, /'P1'/i)).toBe(true);
    expect(hasDdlMatcher(sql, /'P2'/i)).toBe(true);
    expectMonitoringAlertStateTokens(sql);
    expectP2OptInMarker(sql);
  });
});
