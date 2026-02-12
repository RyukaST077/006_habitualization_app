import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert DDL migration contract (Red)', () => {
  test('[migration] aggregation/withdrawal/alert tables are applied in init migration', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+user_daily_activity/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+analytics_daily_kpi/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+account_deletion_jobs/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+monitoring_alert_events/i)).toBe(true);
  });

  test('[migration] placeholder is removed after aggregation/withdrawal/alert DDL implementation', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /placeholder:\s+no\s+schema\s+changes/i)).toBe(false);
  });
});
