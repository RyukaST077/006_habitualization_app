import { describe, expect, test } from 'vitest';

import { expectPolicyAuditMetadataFields } from '../../helpers/db/policy-audit-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('policy/audit trigger DDL (Red)', () => {
  test('[TBL-007] trg_policy_consents_insert_audit is defined and bound', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /trg_policy_consents_insert_audit/i)).toBe(true);
    expect(hasDdlMatcher(sql, /create\s+trigger\s+trg_policy_consents_insert_audit/i)).toBe(true);
    expect(hasDdlMatcher(sql, /audit_logs/i)).toBe(true);
  });

  test('[TBL-006/TBL-008] policy_settings update audit metadata old_version/new_version/policy_type is enforced', () => {
    const sql = loadMigrationSql();

    expect(hasDdlMatcher(sql, /policy_settings/i)).toBe(true);
    expectPolicyAuditMetadataFields(sql);
  });
});
