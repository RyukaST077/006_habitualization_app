import { describe, expect, it } from "vitest";

import {
  POLICY_CONSENTS_RLS_RED_CASES,
  POLICY_CONSENTS_UNIQUE_RED_CASES,
  POLICY_CONSENT_AUDIT_RED_CASES,
  POLICY_TYPE_CONSTRAINT_RED_CASES,
} from "./fixtures/consent-audit-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-020 PR-002 policy_consents DDL red tests", () => {
  it.each(POLICY_CONSENTS_UNIQUE_RED_CASES)(
    "$traceId: user_id + policy_type + policy_version の一意制約を満たす",
    async (redCase) => {
      const hasUnique = await schemaIntrospection.hasUniqueConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.columns,
      );

      expect(hasUnique, `${redCase.traceId}: ${redCase.featureRequirement} 一意制約が必要`).toBe(
        true,
      );
    },
  );

  it.each(POLICY_TYPE_CONSTRAINT_RED_CASES.filter((redCase) => redCase.tableName === "policy_consents"))(
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

  it.each(POLICY_CONSENTS_RLS_RED_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制する",
    async (rlsCase) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata("policy_consents");
      const policy = actual.rlsPolicies.find(
        (candidate) =>
          candidate.name === rlsCase.requiredPolicyName &&
          (candidate.command === rlsCase.command || candidate.command === "all"),
      );

      expect(actual.rlsEnabled).toBe(true);
      expect(policy, `${rlsCase.traceId}: command=${rlsCase.command} のRLS policyが必要`).toBeDefined();
      expect(policy?.name).toBe(rlsCase.requiredPolicyName);

      if (rlsCase.requiredUsingExpression) {
        expect(policy?.usingExpression ?? "").toContain(rlsCase.requiredUsingExpression);
        expect((policy?.usingExpression ?? "").toLowerCase()).not.toBe("true");
      }

      if (rlsCase.requiredCheckExpression) {
        expect(policy?.checkExpression ?? "").toContain(rlsCase.requiredCheckExpression);
        expect((policy?.checkExpression ?? "").toLowerCase()).not.toBe("true");
      }
    },
  );

  it.each(POLICY_CONSENT_AUDIT_RED_CASES)(
    "$traceId: 同意受諾時に POLICY_CONSENT_ACCEPT 監査を出力する",
    async (redCase) => {
      const hasAuditTrigger = await schemaIntrospection.hasTrigger(redCase.tableName, redCase.triggerName);

      expect(hasAuditTrigger, `${redCase.traceId}: ${redCase.requiredAuditAction} 監査出力が必要`).toBe(
        true,
      );
    },
  );
});
