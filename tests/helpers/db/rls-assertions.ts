import { expect } from 'vitest';

import { hasDdlMatcher } from './schema-introspection';

export function expectUserScopedRls(sql: string, tableName: string): void {
  const enableRls = new RegExp(
    `alter\\s+table\\s+${tableName}\\s+enable\\s+row\\s+level\\s+security`,
    'i',
  );
  const userScopedPolicy = new RegExp(
    `create\\s+policy\\s+.*${tableName}.*auth\\.uid\\(\\)\\s*=\\s*user_id`,
    'i',
  );

  expect(hasDdlMatcher(sql, enableRls)).toBe(true);
  expect(hasDdlMatcher(sql, userScopedPolicy)).toBe(true);
}

export function expectRoleRestrictedReadRls(sql: string, tableName: string): void {
  const enableRls = new RegExp(
    `alter\\s+table\\s+${tableName}\\s+enable\\s+row\\s+level\\s+security`,
    'i',
  );
  const rolePolicy = new RegExp(
    `create\\s+policy\\s+.*${tableName}.*ROLE-002|create\\s+policy\\s+.*${tableName}.*role_002|create\\s+policy\\s+.*${tableName}.*role002`,
    'i',
  );
  const serviceRolePolicy = new RegExp(
    `create\\s+policy\\s+.*${tableName}.*service_role`,
    'i',
  );
  const revokedPublicAccess = new RegExp(
    `revoke\\s+all\\s+on\\s+${tableName}\\s+from\\s+anon|revoke\\s+all\\s+on\\s+${tableName}\\s+from\\s+authenticated`,
    'i',
  );

  expect(hasDdlMatcher(sql, enableRls)).toBe(true);
  expect(hasDdlMatcher(sql, rolePolicy)).toBe(true);
  expect(hasDdlMatcher(sql, serviceRolePolicy)).toBe(true);
  expect(hasDdlMatcher(sql, revokedPublicAccess)).toBe(true);
}
