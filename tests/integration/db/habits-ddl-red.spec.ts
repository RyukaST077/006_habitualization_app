import { describe, expect, it } from "vitest";

import {
  HABIT_DDL_CONSTRAINT_RED_CASES,
  HABIT_RLS_RED_CASES,
  HABIT_TRIGGER_RED_EXPECTATIONS,
} from "./fixtures/core-tables";
import { createPendingSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createPendingSchemaIntrospectionPort();

describe("T-018 PR-002 habits DDL red tests", () => {
  it.each(HABIT_DDL_CONSTRAINT_RED_CASES)(
    "$traceId: status/name 制約を満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      expect(
        actual,
        `${redCase.traceId}: DDL実装未完了のためRed失敗を期待（invalid=${redCase.invalidValue})`,
      ).not.toBeNull();

      if (!actual) {
        return;
      }

      expect(actual.constraints).toContain(redCase.expectedConstraint);
    },
  );

  it.each(HABIT_TRIGGER_RED_EXPECTATIONS)(
    "$traceId: archived_at トリガー要件を満たす",
    async (trigger) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      expect(
        actual,
        `${trigger.traceId}: DDL実装未完了のためRed失敗を期待（${trigger.expectedBehavior})`,
      ).not.toBeNull();

      if (!actual) {
        return;
      }

      expect(actual.triggers).toContain(trigger.triggerName);
    },
  );

  it.each(HABIT_RLS_RED_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制し拒否系を担保する",
    async (rlsCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      expect(
        actual,
        `${rlsCase.traceId}: DDL実装未完了のためRed失敗を期待（actor=${rlsCase.actor}, decision=${rlsCase.expectedDecision})`,
      ).not.toBeNull();

      if (!actual) {
        return;
      }

      const policy = actual.rlsPolicies.find(
        (candidate) => candidate.command === rlsCase.command || candidate.command === "all",
      );

      expect(actual.rlsEnabled).toBe(true);
      expect(policy, `${rlsCase.traceId}: command=${rlsCase.command} のRLS policyが必要`).toBeDefined();

      if (!policy) {
        return;
      }

      expect(policy.usingExpression).toContain(rlsCase.requiredUsingExpression);
      expect(policy.usingExpression.toLowerCase()).not.toBe("true");
    },
  );
});
