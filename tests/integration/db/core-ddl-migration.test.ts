import { describe, expect, test } from 'vitest';

import { loadCoreMigrationSql } from '../setup';

describe('core DDL migration contract (Red)', () => {
  test('[migration] core tables are applied in init migration', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/create\s+table\s+profiles/i);
    expect(sql).toMatch(/create\s+table\s+habits/i);
    expect(sql).toMatch(/create\s+table\s+habit_logs/i);
  });

  test('[migration] placeholder is removed after DDL implementation', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).not.toMatch(/placeholder:\s+no\s+schema\s+changes/i);
  });
});
