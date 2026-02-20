import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  AUDIT_METADATA_REQUIRED_RED_CASES,
  CONSENT_AUDIT_TABLE_DDL_EXPECTATIONS,
  CONSENT_AUDIT_TRIGGER_RED_EXPECTATIONS,
  POLICY_CONSENTS_FK_CASES,
  POLICY_CONSENTS_UNIQUE_CASES,
} from "./fixtures/consent-audit-tables";
const initSql = readFileSync("supabase/migrations/00000000000000_init.sql", "utf8");
const normalizedInitSql = initSql.toLowerCase();

describe("T-021 consent/audit DDL test plan", () => {
  it.each(CONSENT_AUDIT_TABLE_DDL_EXPECTATIONS)(
    "$traceId $tableName: カラム/制約/インデックス/RLS/トリガー要件を満たす",
    async (expected) => {
      const tableCreatePrefix = `create table if not exists ${expected.tableName}`;

      expect(normalizedInitSql).toContain(tableCreatePrefix);
      expected.requiredColumns.forEach((column) => {
        expect(normalizedInitSql).toContain(column);
      });
      expected.requiredConstraints.forEach((constraint) => {
        expect(normalizedInitSql).toContain(`constraint ${constraint.toLowerCase()}`);
      });
      expected.requiredIndexes.forEach((indexName) => {
        if (!indexName.startsWith("pk_")) {
          expect(normalizedInitSql).toContain(indexName.toLowerCase());
        }
      });
      expected.requiredTriggers.forEach((triggerName) => {
        expect(normalizedInitSql).toContain(`create or replace trigger ${triggerName.toLowerCase()}`);
      });

      const hasRlsEnable = normalizedInitSql.includes(
        `alter table public.${expected.tableName} enable row level security`,
      );
      expect(hasRlsEnable).toBe(expected.requiredRlsEnabled);
      expected.requiredRlsPolicyNames.forEach((policyName) => {
        expect(normalizedInitSql).toContain(`create policy ${policyName.toLowerCase()} on public.${expected.tableName}`);
      });
      expected.requiredRlsUsingExpressions.forEach((expression) => {
        expect(normalizedInitSql).toContain(expression.toLowerCase());
      });
    },
  );

  it.each(POLICY_CONSENTS_UNIQUE_CASES)(
    "$traceId: policy_consents の版重複防止制約を満たす",
    async (greenCase) => {
      const hasUnique = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} unique (${greenCase.columns.join(", ")})`,
      );

      expect(hasUnique, `${greenCase.traceId}: ${greenCase.featureRequirement} 一意制約が必要`).toBe(
        true,
      );
    },
  );

  it.each(POLICY_CONSENTS_FK_CASES)(
    "$traceId: policy_consents の参照整合を満たす",
    async (greenCase) => {
      const hasForeignKey = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} foreign key`,
      );

      expect(hasForeignKey, `${greenCase.traceId}: ${greenCase.featureRequirement} FK要件が必要`).toBe(
        true,
      );
    },
  );

  it.each(CONSENT_AUDIT_TRIGGER_RED_EXPECTATIONS)(
    "$traceId: 同意/更新時監査トリガー要件を満たす",
    async (trigger) => {
      const hasTrigger = normalizedInitSql.includes(
        `create or replace trigger ${trigger.triggerName.toLowerCase()}`,
      );

      expect(hasTrigger, `${trigger.traceId}: ${trigger.expectedBehavior}`).toBe(true);
    },
  );

  it.each(AUDIT_METADATA_REQUIRED_RED_CASES)(
    "$traceId: policy_settings 更新監査metadata要件を満たす",
    async (greenCase) => {
      const hasNamedConstraint = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} check`,
      );
      const hasAllFragments = greenCase.requiredDefinitionFragments.every((fragment) =>
        normalizedInitSql.includes(fragment.toLowerCase()),
      );

      expect(hasNamedConstraint && hasAllFragments).toBe(true);
    },
  );
});
