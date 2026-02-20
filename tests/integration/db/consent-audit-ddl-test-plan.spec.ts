import { describe, expect, it } from "vitest";

import {
  AUDIT_METADATA_REQUIRED_RED_CASES,
  CONSENT_AUDIT_TABLE_DDL_EXPECTATIONS,
  CONSENT_AUDIT_TRIGGER_RED_EXPECTATIONS,
  POLICY_CONSENTS_FK_RED_CASES,
  POLICY_CONSENTS_UNIQUE_RED_CASES,
} from "./fixtures/consent-audit-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();

describe("T-020 PR-001 consent/audit DDL test plan", () => {
  it.each(CONSENT_AUDIT_TABLE_DDL_EXPECTATIONS)(
    "$traceId $tableName: カラム/制約/インデックス/RLS/トリガー要件を満たす",
    async (expected) => {
      const actual = await schemaIntrospection.getTableSchemaMetadata(expected.tableName);

      const actualColumnNames = actual.columns.map((column) => column.name);
      const actualRlsExpressions = actual.rlsPolicies
        .map((policy) => policy.usingExpression)
        .filter((expression) => expression.length > 0);
      const actualRlsPolicyNames = actual.rlsPolicies.map((policy) => policy.name);

      expect(actualColumnNames).toEqual(expect.arrayContaining(expected.requiredColumns));
      expect(actual.constraints).toEqual(expect.arrayContaining(expected.requiredConstraints));
      expect(actual.indexes).toEqual(expect.arrayContaining(expected.requiredIndexes));
      expect(actual.triggers).toEqual(expect.arrayContaining(expected.requiredTriggers));
      expect(actual.rlsEnabled).toBe(expected.requiredRlsEnabled);
      expect(actualRlsPolicyNames).toEqual(expect.arrayContaining(expected.requiredRlsPolicyNames));
      expect(actualRlsExpressions).toEqual(expect.arrayContaining(expected.requiredRlsUsingExpressions));
    },
  );

  it.each(POLICY_CONSENTS_UNIQUE_RED_CASES)(
    "$traceId: policy_consents の版重複防止制約を満たす",
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

  it.each(POLICY_CONSENTS_FK_RED_CASES)(
    "$traceId: policy_consents の参照整合を満たす",
    async (redCase) => {
      const hasForeignKey = await schemaIntrospection.hasForeignKeyConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.referencedTable,
      );

      expect(hasForeignKey, `${redCase.traceId}: ${redCase.featureRequirement} FK要件が必要`).toBe(
        true,
      );
    },
  );

  it.each(CONSENT_AUDIT_TRIGGER_RED_EXPECTATIONS)(
    "$traceId: 同意/更新時監査トリガー要件を満たす",
    async (trigger) => {
      const hasTrigger = await schemaIntrospection.hasTrigger(trigger.tableName, trigger.triggerName);

      expect(hasTrigger, `${trigger.traceId}: ${trigger.expectedBehavior}`).toBe(true);
    },
  );

  it.each(AUDIT_METADATA_REQUIRED_RED_CASES)(
    "$traceId: IF-004 版差分監査として metadata_json に old_version/new_version/policy_type を強制する",
    async (redCase) => {
      const hasMetadataConstraint = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(
        hasMetadataConstraint,
        `${redCase.traceId}: ${redCase.featureRequirement} metadata必須項目制約が必要`,
      ).toBe(true);
    },
  );
});
