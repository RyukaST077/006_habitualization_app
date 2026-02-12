import { describe, expect, test } from 'vitest';

import {
  expectAggregationWithdrawalAlertConstraint,
  expectAggregationWithdrawalAlertIndex,
  expectAggregationWithdrawalAlertTable,
  expectMonitoringAlertStateTokens,
  expectP2OptInMarker,
} from '../../helpers/db/aggregation-withdrawal-alert-assertions';
import { hasDdlMatcher } from '../../helpers/db/schema-introspection';
import { loadMigrationSql } from '../../helpers/db/migration-runner';

describe('ops alert state DDL (Red)', () => {
  test('[TBL-010][monitoring_alert_events][状態遷移違反] pending/sent/failed constraint and indexes are defined', () => {
    const sql = loadMigrationSql();

    expectAggregationWithdrawalAlertTable(sql, 'monitoring_alert_events');
    expectAggregationWithdrawalAlertConstraint(sql, 'chk_monitoring_alert_events_status');
    expectAggregationWithdrawalAlertConstraint(sql, 'chk_monitoring_alert_events_level');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_monitoring_alert_events_status');
    expectAggregationWithdrawalAlertIndex(sql, 'idx_monitoring_alert_events_level_time');
    expectMonitoringAlertStateTokens(sql);
  });

  test('[TBL-010][monitoring_alert_events][P2既定無効] P2 opt-in rule is described in DDL comments or policy markers', () => {
    const sql = loadMigrationSql();

    expectP2OptInMarker(sql);
    expect(hasDdlMatcher(sql, /P2|opt-?in|default.*disabled|既定無効/i)).toBe(true);
  });
});
