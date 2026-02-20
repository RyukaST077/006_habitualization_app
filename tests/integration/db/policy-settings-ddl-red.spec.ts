import { describe, expect, it } from "vitest";

import {
  POLICY_SETTINGS_SERVICE_ROLE_UPDATE_RED_CASES,
  POLICY_TYPE_CONSTRAINT_RED_CASES,
} from "./fixtures/consent-audit-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-020 PR-002 policy_settings DDL red tests", () => {
  it.each(POLICY_TYPE_CONSTRAINT_RED_CASES.filter((redCase) => redCase.tableName === "policy_settings"))(
    "$traceId: policy_type は terms/privacy のみ許可する",
    async (redCase) => {
      const hasCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasCheck, `${redCase.traceId}: policy_type 制約に terms/privacy が必要`).toBe(true);
    },
  );

  it.each(POLICY_SETTINGS_SERVICE_ROLE_UPDATE_RED_CASES)(
    "$traceId: service role 更新前提と更新監査トリガーを満たす",
    async (redCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);
      const hasAuditTrigger = await schemaIntrospection.hasTrigger(
        redCase.tableName,
        redCase.requiredTriggerName,
      );

      expect(actual.rlsEnabled).toBe(redCase.requiredRlsEnabled);
      expect(actual.rlsPolicies).toHaveLength(redCase.expectedRlsPolicyCount);
      expect(
        hasAuditTrigger,
        `${redCase.traceId}: ${redCase.requiredActorRole} 前提の更新監査トリガーが必要`,
      ).toBe(true);
    },
  );
});
