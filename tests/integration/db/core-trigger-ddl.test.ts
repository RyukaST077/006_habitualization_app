import { describe, expect, test } from 'vitest';

import { loadCoreMigrationSql } from '../setup';

describe('core trigger/constraint DDL (Red)', () => {
  test('[TBL-001] trg_profiles_updated_at is defined and bound', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/trg_profiles_updated_at/i);
    expect(sql).toMatch(/create\s+trigger\s+trg_profiles_updated_at/i);
  });

  test('[TBL-002] trg_habits_archive is defined and bound', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/trg_habits_archive/i);
    expect(sql).toMatch(/create\s+trigger\s+trg_habits_archive/i);
  });

  test('[TBL-003] trg_habit_logs_validate_active is defined and bound', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/trg_habit_logs_validate_active/i);
    expect(sql).toMatch(/create\s+trigger\s+trg_habit_logs_validate_active/i);
  });

  test('[TBL-003] uq_habit_logs_habit_date and fk_habit_logs_habit constraints exist', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/uq_habit_logs_habit_date/i);
    expect(sql).toMatch(/fk_habit_logs_habit/i);
  });
});
