import { describe, test } from 'vitest';

import {
  expectAggregationKpiRoleRestrictedRls,
  expectAggregationUserScopedRls,
} from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('aggregation/withdrawal/alert RLS DDL', () => {
  test('[TBL-004][user_daily_activity][403/参照拒否] auth.uid() = user_id policy is defined', () => {
    const sql = loadMigrationSql();
    expectAggregationUserScopedRls(sql);
  });

  test('[TBL-005][analytics_daily_kpi] ROLE-002/service role read policy and public access revoke are defined', () => {
    const sql = loadMigrationSql();
    expectAggregationKpiRoleRestrictedRls(sql);
  });
});
