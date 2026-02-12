import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('core constraints/index DDL (Red)', () => {
  test('[TBL-001][profiles] expected check/index/trigger definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /chk_profiles_cutoff/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_profiles_status/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_profiles_updated_at/i)).toBe(true);
    expect(hasDdlMatcher(sql, /trg_profiles_updated_at/i)).toBe(true);
  });

  test('[TBL-002][habits] expected check/index/trigger definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /chk_habits_status/i)).toBe(true);
    expect(hasDdlMatcher(sql, /chk_habits_name_len/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_habits_user_status_order/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_habits_user_updated/i)).toBe(true);
    expect(hasDdlMatcher(sql, /trg_habits_archive/i)).toBe(true);
  });

  test('[TBL-003][habit_logs] expected unique/fk/index/trigger definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /uq_habit_logs_habit_date/i)).toBe(true);
    expect(hasDdlMatcher(sql, /fk_habit_logs_habit/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_habit_logs_user_date/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_habit_logs_habit_date/i)).toBe(true);
    expect(hasDdlMatcher(sql, /trg_habit_logs_validate_active/i)).toBe(true);
    expect(hasDdlMatcher(sql, /trg_habit_logs_updated_at/i)).toBe(true);
  });
});
