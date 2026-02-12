import { describe, expect, test } from 'vitest';

import { loadCoreMigrationSql } from '../setup';

describe('core constraints/index DDL (Red)', () => {
  test('[TBL-001][profiles] expected check/index/trigger definitions exist', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/chk_profiles_cutoff/i);
    expect(sql).toMatch(/idx_profiles_status/i);
    expect(sql).toMatch(/idx_profiles_updated_at/i);
    expect(sql).toMatch(/trg_profiles_updated_at/i);
  });

  test('[TBL-002][habits] expected check/index/trigger definitions exist', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/chk_habits_status/i);
    expect(sql).toMatch(/chk_habits_name_len/i);
    expect(sql).toMatch(/idx_habits_user_status_order/i);
    expect(sql).toMatch(/idx_habits_user_updated/i);
    expect(sql).toMatch(/trg_habits_archive/i);
  });

  test('[TBL-003][habit_logs] expected unique/fk/index/trigger definitions exist', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/uq_habit_logs_habit_date/i);
    expect(sql).toMatch(/fk_habit_logs_habit/i);
    expect(sql).toMatch(/idx_habit_logs_user_date/i);
    expect(sql).toMatch(/idx_habit_logs_habit_date/i);
    expect(sql).toMatch(/trg_habit_logs_validate_active/i);
    expect(sql).toMatch(/trg_habit_logs_updated_at/i);
  });
});
