import { expect } from 'vitest';

import { hasConstraintName, hasDdlMatcher, hasIndexName } from './schema-introspection';

export function expectPolicyAuditMetadataFields(sql: string): void {
  expect(hasDdlMatcher(sql, /metadata_json/i)).toBe(true);
  expect(hasDdlMatcher(sql, /old_version/i)).toBe(true);
  expect(hasDdlMatcher(sql, /new_version/i)).toBe(true);
  expect(hasDdlMatcher(sql, /policy_type/i)).toBe(true);
}

export function expectPolicyAuditConstraint(sql: string, constraintName: string): void {
  expect(hasConstraintName(sql, constraintName)).toBe(true);
}

export function expectPolicyAuditIndex(sql: string, indexName: string): void {
  expect(hasIndexName(sql, indexName)).toBe(true);
}
