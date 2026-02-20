import { describe, expect, it } from "vitest";

import {
  USER_DAILY_ACTIVITY_CHECK_RED_CASES,
  USER_DAILY_ACTIVITY_RLS_RED_CASES,
  USER_DAILY_ACTIVITY_UNIQUE_RED_CASES,
} from "./fixtures/ops-ddl-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-023 PR-001 user_daily_activity DDL tests", () => {
  it.each(USER_DAILY_ACTIVITY_UNIQUE_RED_CASES)(
    "$traceId: uq_user_daily_activity_user_date (user_id + activity_date) を満たす",
    async (redCase) => {
      const hasUnique = await schemaIntrospection.hasUniqueConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.columns,
      );

      expect(hasUnique, `${redCase.traceId}: 一意制約が必要`).toBe(true);
    },
  );

  it.each(USER_DAILY_ACTIVITY_CHECK_RED_CASES)(
    "$traceId: chk_user_daily_activity_counts で日次集計件数の非負制約を満たす",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: 件数チェック制約が必要`).toBe(true);
    },
  );

  it.each(USER_DAILY_ACTIVITY_RLS_RED_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制し拒否系を担保する",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("user_daily_activity");

      const policy = actual.rlsPolicies.find(
        (candidate) =>
          candidate.name === redCase.requiredPolicyName &&
          (candidate.command === redCase.command || candidate.command === "all"),
      );

      expect(actual.rlsEnabled).toBe(true);
      expect(policy, `${redCase.traceId}: command=${redCase.command} のRLS policyが必要`).toBeDefined();

      if (redCase.requiredUsingExpression) {
        expect(policy?.usingExpression).toContain(redCase.requiredUsingExpression);
        expect(policy?.usingExpression.toLowerCase()).not.toBe("true");
      }
      if (redCase.requiredCheckExpression) {
        expect(policy?.checkExpression ?? "").toContain(redCase.requiredCheckExpression);
        expect((policy?.checkExpression ?? "").toLowerCase()).not.toBe("true");
      }
    },
  );
});
