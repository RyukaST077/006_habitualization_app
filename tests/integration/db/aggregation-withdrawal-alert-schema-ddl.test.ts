import { describe, expect, test } from 'vitest';

import {
  expectAccountDeletionSlaDefaults,
  expectAggregationWithdrawalAlertTable,
} from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert schema DDL (Red)', () => {
  test('[TBL-004][user_daily_activity] expected columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'user_daily_activity');
    expect(hasDdlMatcher(sql, /user_id\s+uuid\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /activity_date\s+date\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /login_count\s+integer\s+not\s+null\s+default\s+0/i)).toBe(true);
    expect(hasDdlMatcher(sql, /checkin_count\s+integer\s+not\s+null\s+default\s+0/i)).toBe(true);
    expect(hasDdlMatcher(sql, /timezone_snapshot\s+varchar\(64\)\s+not\s+null\s+default\s+'Asia\/Tokyo'/i)).toBe(
      true,
    );
    expect(hasDdlMatcher(sql, /cutoff_snapshot\s+time\s+not\s+null\s+default\s+'03:00:00'/i)).toBe(
      true,
    );
  });

  test('[TBL-005][analytics_daily_kpi] expected anonymized KPI columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'analytics_daily_kpi');
    expect(hasDdlMatcher(sql, /metric_date\s+date\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /metric_key\s+varchar\(64\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /metric_value\s+numeric\(14,\s*2\)\s+not\s+null\s+default\s+0/i)).toBe(true);
    expect(hasDdlMatcher(sql, /dimension_json\s+jsonb\s+not\s+null\s+default\s+'\{\}'::jsonb/i)).toBe(true);
    expect(hasDdlMatcher(sql, /dimension_hash\s+varchar\(64\)\s+not\s+null/i)).toBe(true);
  });

  test('[TBL-009][account_deletion_jobs] expected SLA and status columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'account_deletion_jobs');
    expect(hasDdlMatcher(sql, /job_status\s+varchar\(16\)\s+not\s+null\s+default\s+'queued'/i)).toBe(true);
    expectAccountDeletionSlaDefaults(sql);
    expect(hasDdlMatcher(sql, /retry_count\s+smallint\s+not\s+null\s+default\s+0/i)).toBe(true);
  });

  test('[TBL-010][monitoring_alert_events] expected alert columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'monitoring_alert_events');
    expect(hasDdlMatcher(sql, /alert_level\s+varchar\(8\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /alert_type\s+varchar\(32\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /threshold_rule\s+varchar\(128\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /notification_status\s+varchar\(16\)\s+not\s+null\s+default\s+'pending'/i)).toBe(
      true,
    );
  });
});
