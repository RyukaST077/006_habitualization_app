import { describe, expect, it } from "vitest";

import {
  HABIT_LOG_ACTIVE_VALIDATION_RED_CASES,
  HABIT_LOG_FK_RED_CASES,
  HABIT_LOG_RLS_RED_CASES,
  HABIT_LOG_UNIQUE_RED_CASES,
} from "./fixtures/core-tables";
import { createPendingSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createPendingSchemaIntrospectionPort();

describe("T-018 PR-003 habit_logs DDL red tests", () => {
  it.each(HABIT_LOG_UNIQUE_RED_CASES)(
    "$traceId: uq_habit_logs_habit_date (habit_id + log_date) を満たす",
    async (redCase) => {
      const hasUnique = await schemaIntrospection.hasUniqueConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.columns,
      );

      expect(
        hasUnique,
        `${redCase.traceId}: ${redCase.featureRequirement} 冪等制約のDDL実装未完了のためRed失敗を期待`,
      ).toBe(true);
    },
  );

  it.each(HABIT_LOG_FK_RED_CASES)(
    "$traceId: fk_habit_logs_habit 参照整合を満たす",
    async (redCase) => {
      const hasForeignKey = await schemaIntrospection.hasForeignKeyConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.referencedTable,
      );

      expect(
        hasForeignKey,
        `${redCase.traceId}: ${redCase.featureRequirement} FK要件のDDL実装未完了のためRed失敗を期待`,
      ).toBe(true);
    },
  );

  it.each(HABIT_LOG_ACTIVE_VALIDATION_RED_CASES)(
    "$traceId: validate_active で archived 習慣への登録を拒否する",
    async (redCase) => {
      const hasValidationTrigger = await schemaIntrospection.hasTrigger("habit_logs", redCase.triggerName);

      expect(
        hasValidationTrigger,
        `${redCase.traceId}: ${redCase.featureRequirement} active制御のDDL実装未完了のためRed失敗を期待（status=${redCase.invalidHabitStatus})`,
      ).toBe(true);
    },
  );

  it.each(HABIT_LOG_RLS_RED_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制し拒否系を担保する",
    async (rlsCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("habit_logs");

      expect(
        actual,
        `${rlsCase.traceId}: FR-025 DDL実装未完了のためRed失敗を期待（actor=${rlsCase.actor}, decision=${rlsCase.expectedDecision})`,
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
