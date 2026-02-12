import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('core trigger/constraint DDL (Red)', () => {
  test('[TBL-001] trg_profiles_updated_at is defined and bound', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /trg_profiles_updated_at/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+trigger\s+trg_profiles_updated_at/i)).toBe(true);
  });

  test('[TBL-002] trg_habits_archive is defined and bound', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /trg_habits_archive/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+trigger\s+trg_habits_archive/i)).toBe(true);
  });

  test('[TBL-003] trg_habit_logs_validate_active is defined and bound', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /trg_habit_logs_validate_active/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+trigger\s+trg_habit_logs_validate_active/i)).toBe(true);
  });

  test('[TBL-003] uq_habit_logs_habit_date and fk_habit_logs_habit constraints exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /uq_habit_logs_habit_date/i)).toBe(true);
    expect(hasDdlMatcher(sql, /fk_habit_logs_habit/i)).toBe(true);
  });
});
