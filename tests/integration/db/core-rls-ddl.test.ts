import { describe, test } from 'vitest';

import { loadMigrationSql } from '../../helpers/db/migration-runner';
import { expectUserScopedRls } from '../../helpers/db/rls-assertions';

describe('core RLS DDL (Red)', () => {
  test('[TBL-001][profiles][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectUserScopedRls(sql, 'profiles');
  });

  test('[TBL-002][habits][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectUserScopedRls(sql, 'habits');
  });

  test('[TBL-003][habit_logs][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectUserScopedRls(sql, 'habit_logs');
  });
});
