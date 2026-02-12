import { describe, test } from 'vitest';

import { expectAggregationUserScopedRls } from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert RLS DDL (Red)', () => {
  test('[TBL-004][user_daily_activity][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectAggregationUserScopedRls(sql);
  });
});
