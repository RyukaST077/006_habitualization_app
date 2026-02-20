import { describe, expect, it } from "vitest";

import {
  MONITORING_ALERT_EVENTS_INDEX_RED_CASES,
  MONITORING_ALERT_EVENTS_LEVEL_CHECK_RED_CASES,
  MONITORING_ALERT_EVENTS_NOTIFICATION_TRACKING_RED_CASES,
  MONITORING_ALERT_EVENTS_STATUS_CHECK_RED_CASES,
} from "./fixtures/ops-ddl-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-022 PR-003 monitoring_alert_events DDL red tests", () => {
  it.each(MONITORING_ALERT_EVENTS_LEVEL_CHECK_RED_CASES)(
    "$traceId: alert_level 通知レベル制約を満たす",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: ${redCase.featureRequirement} 通知レベル制約が必要`).toBe(true);
    },
  );

  it.each(MONITORING_ALERT_EVENTS_STATUS_CHECK_RED_CASES)(
    "$traceId: notification_status 通知状態制約を満たす",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: ${redCase.featureRequirement} 通知状態制約が必要`).toBe(true);
    },
  );

  it.each(MONITORING_ALERT_EVENTS_INDEX_RED_CASES)(
    "$traceId: 運用クエリ向けインデックス要件を満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);

      expect(actual.columns.length, `${redCase.traceId}: monitoring_alert_events テーブル作成が必要`).toBeGreaterThan(
        0,
      );
      redCase.requiredIndexes.forEach((indexName) => {
        expect(
          actual.indexes.includes(indexName),
          `${redCase.traceId}: ${redCase.featureRequirement} ${indexName} が必要`,
        ).toBe(true);
      });
    },
  );

  it.each(MONITORING_ALERT_EVENTS_NOTIFICATION_TRACKING_RED_CASES)(
    "$traceId: 通知失敗/再送追跡カラム要件を満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);
      const columnNames = actual.columns.map((column) => column.name);

      expect(actual.columns.length, `${redCase.traceId}: monitoring_alert_events テーブル作成が必要`).toBeGreaterThan(
        0,
      );
      redCase.requiredColumns.forEach((requiredColumn) => {
        expect(
          columnNames.includes(requiredColumn),
          `${redCase.traceId}: ${redCase.featureRequirement} ${requiredColumn} カラムが必要`,
        ).toBe(true);
      });
    },
  );
});
