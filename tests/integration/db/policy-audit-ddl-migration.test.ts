import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('policy/audit DDL migration contract (Red)', () => {
  test('[migration] policy/audit tables are applied in init migration', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+policy_settings/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+policy_consents/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+table\s+audit_logs/i)).toBe(true);
  });

  test('[migration] placeholder is removed after policy/audit DDL implementation', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /placeholder:\s+no\s+schema\s+changes/i)).toBe(false);
  });
});
