import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('policy/audit schema DDL (Red)', () => {
  test('[TBL-006][policy_settings] expected columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+policy_settings/i)).toBe(true);
    expect(hasDdlMatcher(sql, /policy_type\s+varchar\(16\)\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /effective_from\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i)).toBe(
      true,
    );
    expect(hasDdlMatcher(sql, /updated_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i)).toBe(
      true,
    );
  });

  test('[TBL-007][policy_consents] expected columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+policy_consents/i)).toBe(true);
    expect(hasDdlMatcher(sql, /id\s+bigserial\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /consented_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i)).toBe(
      true,
    );
    expect(hasDdlMatcher(sql, /consent_source\s+varchar\(16\)\s+not\s+null\s+default\s+'web'/i)).toBe(
      true,
    );
  });

  test('[TBL-008][audit_logs] expected required columns/defaults are defined in migration SQL', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /create\s+table\s+audit_logs/i)).toBe(true);
    expect(hasDdlMatcher(sql, /id\s+bigserial\s+primary\s+key/i)).toBe(true);
    expect(hasDdlMatcher(sql, /occurred_at\s+timestamptz\s+not\s+null\s+default\s+now\(\)/i)).toBe(true);
    expect(hasDdlMatcher(sql, /action\s+varchar\(64\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /target_type\s+varchar\(64\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /target_id\s+varchar\(128\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /result\s+varchar\(16\)\s+not\s+null/i)).toBe(true);
    expect(hasDdlMatcher(sql, /metadata_json\s+jsonb\s+not\s+null\s+default\s+'\{\}'::jsonb/i)).toBe(
      true,
    );
  });
});
