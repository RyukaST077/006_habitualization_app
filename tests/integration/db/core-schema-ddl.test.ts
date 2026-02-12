import { describe, expect, test } from 'vitest';

import { loadCoreMigrationSql } from '../setup';

describe('core schema DDL (Red)', () => {
  test('[TBL-001][profiles] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/create\s+table\s+profiles/i);
    expect(sql).toMatch(/user_id\s+uuid\s+primary\s+key/i);
    expect(sql).toMatch(/timezone\s+varchar\(64\)\s+not\s+null\s+default\s+'Asia\/Tokyo'/i);
    expect(sql).toMatch(/day_cutoff_time\s+time\s+not\s+null\s+default\s+'03:00:00'/i);
  });

  test('[TBL-002][habits] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/create\s+table\s+habits/i);
    expect(sql).toMatch(/id\s+bigserial\s+primary\s+key/i);
    expect(sql).toMatch(/status\s+varchar\(16\)\s+not\s+null\s+default\s+'active'/i);
    expect(sql).toMatch(/display_order\s+integer\s+not\s+null\s+default\s+100/i);
  });

  test('[TBL-003][habit_logs] expected columns and defaults are defined in migration SQL', () => {
    const sql = loadCoreMigrationSql();

    expect(sql).toMatch(/create\s+table\s+habit_logs/i);
    expect(sql).toMatch(/id\s+bigserial\s+primary\s+key/i);
    expect(sql).toMatch(/checked_in_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i);
    expect(sql).toMatch(/source\s+varchar\(16\)\s+not\s+null\s+default\s+'manual'/i);
  });
});
