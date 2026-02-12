import { describe, expect, test } from 'vitest';

import { hasConstraintName, hasDdlMatcher, hasIndexName } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('ops alert state DDL (Red)', () => {
  test('[TBL-010][monitoring_alert_events][状態遷移違反] pending/sent/failed constraint and indexes are defined', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+monitoring_alert_events/i)).toBe(true);
    expect(hasConstraintName(sql, 'chk_monitoring_alert_events_status')).toBe(true);
    expect(hasConstraintName(sql, 'chk_monitoring_alert_events_level')).toBe(true);
    expect(hasIndexName(sql, 'idx_monitoring_alert_events_status')).toBe(true);
    expect(hasIndexName(sql, 'idx_monitoring_alert_events_level_time')).toBe(true);
    expect(hasDdlMatcher(sql, /pending/i)).toBe(true);
    expect(hasDdlMatcher(sql, /sent/i)).toBe(true);
    expect(hasDdlMatcher(sql, /failed/i)).toBe(true);
  });

  test('[TBL-010][monitoring_alert_events][P2既定無効] P2 opt-in rule is described in DDL comments or policy markers', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /P2/i)).toBe(true);
    expect(hasDdlMatcher(sql, /既定無効|default.*disabled|opt-?in/i)).toBe(true);
  });
});
