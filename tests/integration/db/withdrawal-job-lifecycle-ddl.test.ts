import { describe, expect, test } from 'vitest';

import { hasConstraintName, hasDdlMatcher, hasIndexName } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('withdrawal job lifecycle DDL (Red)', () => {
  test('[TBL-009][account_deletion_jobs][状態遷移違反] queued -> in_progress -> completed/failed constraint is defined', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+account_deletion_jobs/i)).toBe(true);
    expect(hasConstraintName(sql, 'chk_account_deletion_jobs_status')).toBe(true);
    expect(hasConstraintName(sql, 'uq_account_deletion_jobs_user')).toBe(true);
    expect(hasIndexName(sql, 'idx_account_deletion_jobs_status_due')).toBe(true);
    expect(hasDdlMatcher(sql, /queued/i)).toBe(true);
    expect(hasDdlMatcher(sql, /in_progress/i)).toBe(true);
    expect(hasDdlMatcher(sql, /completed/i)).toBe(true);
    expect(hasDdlMatcher(sql, /failed/i)).toBe(true);
  });

  test('[TBL-009][account_deletion_jobs][SLA違反] disable/hard_delete due defaults are defined', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /disable_due_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)\s*\+\s*interval\s+'60 second'/i)).toBe(true);
    expect(hasDdlMatcher(sql, /hard_delete_due_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)\s*\+\s*interval\s+'5 minute'/i)).toBe(true);
  });
});
