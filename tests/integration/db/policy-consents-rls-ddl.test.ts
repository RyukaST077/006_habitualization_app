import { describe, test } from 'vitest';

import { loadMigrationSql } from '../../helpers/db/migration-runner';
import { expectUserScopedRls } from '../../helpers/db/rls-assertions';

describe('policy consents RLS DDL (Red)', () => {
  test('[TBL-007][policy_consents][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectUserScopedRls(sql, 'policy_consents');
  });
});
