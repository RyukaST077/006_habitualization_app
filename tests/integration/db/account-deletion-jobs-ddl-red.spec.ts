import { describe, expect, it } from "vitest";

import {
  ACCOUNT_DELETION_JOBS_SLA_RETRY_RED_CASES,
  ACCOUNT_DELETION_JOBS_STATUS_CHECK_RED_CASES,
  ACCOUNT_DELETION_JOBS_UNIQUE_RED_CASES,
} from "./fixtures/ops-ddl-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-022 PR-003 account_deletion_jobs DDL red tests", () => {
  it.each(ACCOUNT_DELETION_JOBS_STATUS_CHECK_RED_CASES)(
    "$traceId: job_status の状態遷移制約を満たす",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: ${redCase.featureRequirement} 状態遷移チェック制約が必要`).toBe(
        true,
      );
    },
  );

  it.each(ACCOUNT_DELETION_JOBS_UNIQUE_RED_CASES)(
    "$traceId: user_id 単位のジョブ一意制約を満たす",
    async (redCase) => {
      const hasUnique = await schemaIntrospection.hasUniqueConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.columns,
      );

      expect(hasUnique, `${redCase.traceId}: ${redCase.featureRequirement} 一意制約が必要`).toBe(true);
    },
  );

  it.each(ACCOUNT_DELETION_JOBS_SLA_RETRY_RED_CASES)(
    "$traceId: SLA期限列と失敗追跡列を満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);
      const columnNames = actual.columns.map((column) => column.name);

      expect(actual.columns.length, `${redCase.traceId}: account_deletion_jobs テーブル作成が必要`).toBeGreaterThan(
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
