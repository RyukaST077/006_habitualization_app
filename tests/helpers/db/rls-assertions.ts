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

