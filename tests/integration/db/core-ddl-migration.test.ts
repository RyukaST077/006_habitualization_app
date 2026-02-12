import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('core DDL migration contract (Red)', () => {
  test('[migration] core tables are applied in init migration', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+profiles/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+habits/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+habit_logs/i)).toBe(true);
  });

  test('[migration] placeholder is removed after DDL implementation', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /placeholder:\s+no\s+schema\s+changes/i)).toBe(false);
  });
});
