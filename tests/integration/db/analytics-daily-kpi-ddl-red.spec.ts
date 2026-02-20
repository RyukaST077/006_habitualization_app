import { describe, expect, it } from "vitest";

import {
  ANALYTICS_DAILY_KPI_ANONYMITY_RED_CASES,
  ANALYTICS_DAILY_KPI_CHECK_RED_CASES,
  ANALYTICS_DAILY_KPI_UNIQUE_RED_CASES,
} from "./fixtures/ops-ddl-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-022 PR-002 analytics_daily_kpi DDL red tests", () => {
  it.each(ANALYTICS_DAILY_KPI_UNIQUE_RED_CASES)(
    "$traceId: uq_analytics_daily_kpi_key (metric_date + metric_key + dimension_hash) を満たす",
    async (redCase) => {
      const hasUnique = await schemaIntrospection.hasUniqueConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.columns,
      );

      expect(hasUnique, `${redCase.traceId}: 一意制約が必要`).toBe(true);
    },
  );

  it.each(ANALYTICS_DAILY_KPI_CHECK_RED_CASES)(
    "$traceId: chk_analytics_daily_kpi_non_negative でKPI値の非負制約を満たす",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: 非負チェック制約が必要`).toBe(true);
    },
  );

  it.each(ANALYTICS_DAILY_KPI_ANONYMITY_RED_CASES)(
    "$traceId: 匿名KPI方針として個人識別子カラムを許容しない",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);
      const columnNames = actual.columns.map((column) => column.name);

      expect(actual.columns.length, `${redCase.traceId}: analytics_daily_kpi テーブル作成が必要`).toBeGreaterThan(0);
      redCase.forbiddenColumns.forEach((forbiddenColumn) => {
        expect(
          columnNames.includes(forbiddenColumn),
          `${redCase.traceId}: ${forbiddenColumn} カラムは許容しない`,
        ).toBe(false);
      });
    },
  );
});
