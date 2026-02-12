import { describe, test } from 'vitest';

import { loadMigrationSql } from '../../helpers/db/migration-runner';
import { expectUserScopedRls } from '../../helpers/db/rls-assertions';

describe('aggregation/withdrawal/alert RLS DDL (Red)', () => {
  test('[TBL-004][user_daily_activity][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectUserScopedRls(sql, 'user_daily_activity');
  });
});
