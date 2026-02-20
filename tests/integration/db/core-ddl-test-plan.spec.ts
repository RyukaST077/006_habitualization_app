import { describe, expect, it } from "vitest";

import { CORE_TABLE_DDL_EXPECTATIONS } from "./fixtures/core-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-019 PR-001 core DDL introspection tests", () => {
  it.each(CORE_TABLE_DDL_EXPECTATIONS)(
    "$traceId $tableName: カラム/制約/インデックス/RLS/トリガー要件を満たす",
    async (expected) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(expected.tableName);

      const actualColumnNames = actual.columns.map((column) => column.name);
      const actualRlsExpressions = actual.rlsPolicies
        .map((policy) => policy.usingExpression)
        .filter((expression) => expression.length > 0);

      expect(actualColumnNames).toEqual(expect.arrayContaining(expected.requiredColumns));
      expect(actual.constraints).toEqual(expect.arrayContaining(expected.requiredConstraints));
      expect(actual.indexes).toEqual(expect.arrayContaining(expected.requiredIndexes));
      expect(actual.triggers).toEqual(expect.arrayContaining(expected.requiredTriggers));
      expect(actual.rlsEnabled).toBe(true);
      expect(actualRlsExpressions).toEqual(
        expect.arrayContaining(expected.requiredRlsUsingExpressions),
      );
    },
  );
});
