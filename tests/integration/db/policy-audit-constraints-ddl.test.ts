import { describe, expect, test } from 'vitest';

import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('policy/audit constraints/index DDL (Red)', () => {
  test('[TBL-006][policy_settings] expected constraint/index/audit definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /chk_policy_settings_type/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_policy_settings_updated/i)).toBe(true);
    expect(hasDdlMatcher(sql, /audit_logs/i)).toBe(true);
  });

  test('[TBL-007][policy_consents] expected check/unique/fk/index/rls definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /chk_policy_consents_type/i)).toBe(true);
    expect(hasDdlMatcher(sql, /uq_policy_consents_user_type_ver/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_policy_consents_user_type_time/i)).toBe(true);
    expect(hasDdlMatcher(sql, /references\s+profiles\s*\(\s*user_id\s*\)/i)).toBe(true);
    expect(hasDdlMatcher(sql, /references\s+policy_settings\s*\(\s*policy_type\s*\)/i)).toBe(true);
    expect(hasDdlMatcher(sql, /enable\s+row\s+level\s+security/i)).toBe(true);
    expect(hasDdlMatcher(sql, /auth\.uid\(\)\s*=\s*user_id/i)).toBe(true);
  });

  test('[TBL-008][audit_logs] expected check/index definitions exist', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /chk_audit_logs_result/i)).toBe(true);
    expect(hasDdlMatcher(sql, /chk_audit_logs_required/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_audit_logs_occurred/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_audit_logs_actor/i)).toBe(true);
    expect(hasDdlMatcher(sql, /idx_audit_logs_action_result/i)).toBe(true);
  });
});
