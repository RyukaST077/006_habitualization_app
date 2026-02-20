import { describe, expect, it } from "vitest";

import {
  HABIT_DDL_CONSTRAINT_RED_CASES,
  HABIT_RLS_RED_CASES,
  HABIT_TRIGGER_RED_EXPECTATIONS,
} from "./fixtures/core-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-019 PR-002 habits DDL tests", () => {
  it.each(HABIT_DDL_CONSTRAINT_RED_CASES)(
    "$traceId: status/name 制約を満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      expect(actual.constraints).toContain(redCase.expectedConstraint);
    },
  );

  it.each(HABIT_TRIGGER_RED_EXPECTATIONS)(
    "$traceId: archived_at トリガー要件を満たす",
    async (trigger) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      expect(actual.triggers).toContain(trigger.triggerName);
    },
  );

  it.each(HABIT_RLS_RED_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制し拒否系を担保する",
    async (rlsCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habits");

      const policy = actual.rlsPolicies.find(
        (candidate) =>
          candidate.name === rlsCase.requiredPolicyName &&
          (candidate.command === rlsCase.command || candidate.command === "all"),
      );

      expect(actual.rlsEnabled).toBe(true);
      expect(policy, `${rlsCase.traceId}: command=${rlsCase.command} のRLS policyが必要`).toBeDefined();
      expect(policy?.name).toBe(rlsCase.requiredPolicyName);

      if (rlsCase.requiredUsingExpression) {
        expect(policy?.usingExpression).toContain(rlsCase.requiredUsingExpression);
        expect(policy?.usingExpression.toLowerCase()).not.toBe("true");
      }
      if (rlsCase.requiredCheckExpression) {
        expect(policy?.checkExpression ?? "").toContain(rlsCase.requiredCheckExpression);
        expect((policy?.checkExpression ?? "").toLowerCase()).not.toBe("true");
      }
    },
  );
});
