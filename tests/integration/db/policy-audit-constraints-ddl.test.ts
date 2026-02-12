import { describe, expect, test } from 'vitest';

import {
  expectPolicyAuditConstraint,
  expectPolicyAuditIndex,
} from '../../helpers/db/policy-audit-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('policy/audit constraints/index DDL (Red)', () => {
  test('[TBL-006][policy_settings] expected constraint/index/audit definitions exist', () => {
    const sql = loadMigrationSql();

    expectPolicyAuditConstraint(sql, 'chk_policy_settings_type');
    expectPolicyAuditIndex(sql, 'idx_policy_settings_updated');
    expect(hasDdlMatcher(sql, /audit_logs/i)).toBe(true);
  });

  test('[TBL-007][policy_consents] expected check/unique/fk/index/rls definitions exist', () => {
    const sql = loadMigrationSql();

    expectPolicyAuditConstraint(sql, 'chk_policy_consents_type');
    expectPolicyAuditConstraint(sql, 'uq_policy_consents_user_type_ver');
    expectPolicyAuditIndex(sql, 'idx_policy_consents_user_type_time');
    expect(hasDdlMatcher(sql, /references\s+profiles\s*\(\s*user_id\s*\)/i)).toBe(true);
    expect(hasDdlMatcher(sql, /references\s+policy_settings\s*\(\s*policy_type\s*\)/i)).toBe(true);
    expect(hasDdlMatcher(sql, /enable\s+row\s+level\s+security/i)).toBe(true);
    expect(hasDdlMatcher(sql, /auth\.uid\(\)\s*=\s*user_id/i)).toBe(true);
  });

  test('[TBL-008][audit_logs] expected check/index definitions exist', () => {
    const sql = loadMigrationSql();

    expectPolicyAuditConstraint(sql, 'chk_audit_logs_result');
    expectPolicyAuditConstraint(sql, 'chk_audit_logs_required');
    expectPolicyAuditIndex(sql, 'idx_audit_logs_occurred');
    expectPolicyAuditIndex(sql, 'idx_audit_logs_actor');
    expectPolicyAuditIndex(sql, 'idx_audit_logs_action_result');
  });
});
