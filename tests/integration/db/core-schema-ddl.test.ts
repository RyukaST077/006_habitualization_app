import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('core schema DDL (Red)', () => {
  test('[TBL-001][profiles] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+profiles/i)).toBe(true);
    expect(hasDdlMatcher(sql, /user_id\s+uuid\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /timezone\s+varchar\(64\)\s+not\s+null\s+default\s+'Asia\/Tokyo'/i)).toBe(
      true,
    );
    expect(hasDdlMatcher(sql, /day_cutoff_time\s+time\s+not\s+null\s+default\s+'03:00:00'/i)).toBe(
      true,
    );
  });

  test('[TBL-002][habits] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+habits/i)).toBe(true);
    expect(hasDdlMatcher(sql, /id\s+bigserial\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /status\s+varchar\(16\)\s+not\s+null\s+default\s+'active'/i)).toBe(true);
    expect(hasDdlMatcher(sql, /display_order\s+integer\s+not\s+null\s+default\s+100/i)).toBe(true);
  });

  test('[TBL-003][habit_logs] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+habit_logs/i)).toBe(true);
    expect(hasDdlMatcher(sql, /id\s+bigserial\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /checked_in_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i)).toBe(
      true,
    );
    expect(hasDdlMatcher(sql, /source\s+varchar\(16\)\s+not\s+null\s+default\s+'manual'/i)).toBe(true);
  });
});
