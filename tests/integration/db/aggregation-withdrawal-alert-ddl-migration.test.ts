import { describe, expect, test } from 'vitest';

import { expectAggregationWithdrawalAlertTable } from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert DDL migration contract (Red)', () => {
  test('[migration] aggregation/withdrawal/alert tables are applied in init migration', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'user_daily_activity');
    expectAggregationWithdrawalAlertTable(sql, 'analytics_daily_kpi');
    expectAggregationWithdrawalAlertTable(sql, 'account_deletion_jobs');
    expectAggregationWithdrawalAlertTable(sql, 'monitoring_alert_events');
  });

  test('[migration] placeholder is removed after aggregation/withdrawal/alert DDL implementation', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /placeholder:\s+no\s+schema\s+changes/i)).toBe(false);
  });
});
