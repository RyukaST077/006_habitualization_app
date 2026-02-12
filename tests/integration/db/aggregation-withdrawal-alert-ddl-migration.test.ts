import { describe, expect, test } from 'vitest';

import { expectAggregationWithdrawalAlertTable } from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert DDL migration contract', () => {
  test('[migration] aggregation/withdrawal/alert tables are applied in init migration', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'user_daily_activity');
    expectAggregationWithdrawalAlertTable(sql, 'analytics_daily_kpi');
    expectAggregationWithdrawalAlertTable(sql, 'account_deletion_jobs');
    expectAggregationWithdrawalAlertTable(sql, 'monitoring_alert_events');
  });

  test('[migration] no placeholder remains after aggregation/withdrawal/alert DDL implementation', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /placeholder:\s+no\s+schema\s+changes/i)).toBe(false);
  });

  test('[IF-005] operational SQL referenced columns exist in migration DDL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /metric_date/i)).toBe(true);
    expect(hasDdlMatcher(sql, /metric_key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /metric_value/i)).toBe(true);
    expect(hasDdlMatcher(sql, /dimension_json/i)).toBe(true);
    expect(hasDdlMatcher(sql, /requested_at/i)).toBe(true);
    expect(hasDdlMatcher(sql, /disabled_at/i)).toBe(true);
    expect(hasDdlMatcher(sql, /hard_deleted_at/i)).toBe(true);
    expect(hasDdlMatcher(sql, /last_error/i)).toBe(true);
  });
});
