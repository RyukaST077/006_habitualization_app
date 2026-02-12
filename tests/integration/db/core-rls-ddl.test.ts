import { describe, expect, test } from 'vitest';

import { loadCoreMigrationSql } from '../setup';

describe('core RLS DDL (Red)', () => {
  test('[TBL-001][profiles][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/alter\s+table\s+profiles\s+enable\s+row\s+level\s+security/i);
    expect(sql).toMatch(/create\s+policy\s+.*profiles.*auth\.uid\(\)\s*=\s*user_id/i);
  });

  test('[TBL-002][habits][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/alter\s+table\s+habits\s+enable\s+row\s+level\s+security/i);
    expect(sql).toMatch(/create\s+policy\s+.*habits.*auth\.uid\(\)\s*=\s*user_id/i);
  });

  test('[TBL-003][habit_logs][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/alter\s+table\s+habit_logs\s+enable\s+row\s+level\s+security/i);
    expect(sql).toMatch(/create\s+policy\s+.*habit_logs.*auth\.uid\(\)\s*=\s*user_id/i);
  });
});
