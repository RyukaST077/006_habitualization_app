import { describe, expect, test } from 'vitest';

import {
  hasConstraintName,
  hasDdlMatcher,
  hasIndexName,
} from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert constraints/index DDL (Red)', () => {
  test('[TBL-004][user_daily_activity] expected check/unique/index and RLS definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasConstraintName(sql, 'chk_user_daily_activity_counts')).toBe(true);
    expect(hasConstraintName(sql, 'uq_user_daily_activity_user_date')).toBe(true);
    expect(hasIndexName(sql, 'idx_user_daily_activity_date')).toBe(true);
    expect(hasDdlMatcher(sql, /enable\s+row\s+level\s+security/i)).toBe(true);
    expect(hasDdlMatcher(sql, /auth\.uid\(\)\s*=\s*user_id/i)).toBe(true);
  });

  test('[TBL-005][analytics_daily_kpi] expected non-negative/unique/index and role restriction definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasConstraintName(sql, 'chk_analytics_daily_kpi_non_negative')).toBe(true);
    expect(hasConstraintName(sql, 'uq_analytics_daily_kpi_key')).toBe(true);
    expect(hasIndexName(sql, 'idx_analytics_daily_kpi_date_key')).toBe(true);
    expect(hasDdlMatcher(sql, /role-002|role_002|role002/i)).toBe(true);
    expect(hasDdlMatcher(sql, /service\s+role/i)).toBe(true);
    expect(hasDdlMatcher(sql, /user_id|email/i)).toBe(false);
  });

  test('[TBL-009][account_deletion_jobs] expected status/unique/index and lifecycle markers exist', () => {
    const sql = loadMigrationSql();

    expect(hasConstraintName(sql, 'chk_account_deletion_jobs_status')).toBe(true);
    expect(hasConstraintName(sql, 'uq_account_deletion_jobs_user')).toBe(true);
    expect(hasIndexName(sql, 'idx_account_deletion_jobs_status_due')).toBe(true);
    expect(hasDdlMatcher(sql, /queued/i)).toBe(true);
    expect(hasDdlMatcher(sql, /in_progress/i)).toBe(true);
    expect(hasDdlMatcher(sql, /completed|failed/i)).toBe(true);
  });

  test('[TBL-010][monitoring_alert_events] expected level/status constraints and indexes exist', () => {
    const sql = loadMigrationSql();

    expect(hasConstraintName(sql, 'chk_monitoring_alert_events_level')).toBe(true);
    expect(hasConstraintName(sql, 'chk_monitoring_alert_events_status')).toBe(true);
    expect(hasIndexName(sql, 'idx_monitoring_alert_events_status')).toBe(true);
    expect(hasIndexName(sql, 'idx_monitoring_alert_events_level_time')).toBe(true);
    expect(hasDdlMatcher(sql, /'P1'/i)).toBe(true);
    expect(hasDdlMatcher(sql, /'P2'/i)).toBe(true);
    expect(hasDdlMatcher(sql, /pending|sent|failed/i)).toBe(true);
  });
});
