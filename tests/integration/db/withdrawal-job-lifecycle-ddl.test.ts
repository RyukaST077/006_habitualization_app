import { describe, expect, test } from 'vitest';

import {
  expectAccountDeletionLifecycleTokens,
  expectAccountDeletionSlaDefaults,
  expectAggregationWithdrawalAlertConstraint,
  expectAggregationWithdrawalAlertIndex,
  expectAggregationWithdrawalAlertTable,
} from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('withdrawal job lifecycle DDL (Red)', () => {
  test('[TBL-009][account_deletion_jobs][状態遷移違反] queued -> in_progress -> completed/failed constraint is defined', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'account_deletion_jobs');
    expectAggregationWithdrawalAlertConstraint(sql, 'chk_account_deletion_jobs_status');
    expectAggregationWithdrawalAlertConstraint(sql, 'uq_account_deletion_jobs_user');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_account_deletion_jobs_status_due');
    expectAccountDeletionLifecycleTokens(sql);
  });

  test('[TBL-009][account_deletion_jobs][SLA違反] disable/hard_delete due defaults are defined', () => {
    const sql = loadMigrationSql();

    expectAccountDeletionSlaDefaults(sql);
    expect(hasDdlMatcher(sql, /disable_due_at|hard_delete_due_at/i)).toBe(true);
  });
});
