import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  POLICY_CONSENTS_RLS_CASES,
  POLICY_CONSENTS_UNIQUE_CASES,
  POLICY_CONSENT_AUDIT_CASES,
  POLICY_TYPE_CONSTRAINT_CASES,
} from "./fixtures/consent-audit-tables";
const initSql = readFileSync("supabase/migrations/00000000000000_init.sql", "utf8");
const normalizedInitSql = initSql.toLowerCase();

function getPolicyStatement(policyName: string): string | null {
  const match = normalizedInitSql.match(new RegExp(`create policy\\s+${policyName}\\s+on\\s+public\\.policy_consents[\\s\\S]*?;`));
  return match?.[0] ?? null;
}

describe("T-021 PR-002 policy_consents DDL green tests", () => {
  it.each(POLICY_CONSENTS_UNIQUE_CASES)(
    "$traceId: user_id + policy_type + policy_version の一意制約を満たす",
    async (greenCase) => {
      const hasUnique = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} unique (${greenCase.columns.join(", ")})`,
      );

      expect(hasUnique, `${greenCase.traceId}: ${greenCase.featureRequirement} 一意制約が必要`).toBe(
        true,
      );
    },
  );

  it.each(POLICY_TYPE_CONSTRAINT_CASES.filter((greenCase) => greenCase.tableName === "policy_consents"))(
    "$traceId: policy_type は terms/privacy のみ許可する",
    async (greenCase) => {
      const hasNamedCheck = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} check`,
      );
      const hasAllFragments = greenCase.requiredDefinitionFragments.every((fragment) =>
        normalizedInitSql.includes(fragment.toLowerCase()),
      );
      const hasCheck = hasNamedCheck && hasAllFragments;

      expect(hasCheck, `${greenCase.traceId}: policy_type 制約に terms/privacy が必要`).toBe(true);
    },
  );

  it.each(POLICY_CONSENTS_RLS_CASES)(
    "$traceId: RLS は auth.uid() = user_id を強制する",
    async (rlsCase) => {
      const hasRlsEnabled = normalizedInitSql.includes(
        "alter table public.policy_consents enable row level security",
      );
      const policySql = getPolicyStatement(rlsCase.requiredPolicyName);

      expect(hasRlsEnabled).toBe(true);
      expect(policySql, `${rlsCase.traceId}: command=${rlsCase.command} のRLS policyが必要`).toBeTruthy();
      expect(policySql ?? "").toContain(`for ${rlsCase.command}`);

      if (rlsCase.requiredUsingExpression) {
        expect(policySql ?? "").toContain(rlsCase.requiredUsingExpression.toLowerCase());
      }

      if (rlsCase.requiredCheckExpression) {
        expect(policySql ?? "").toContain(rlsCase.requiredCheckExpression.toLowerCase());
      }
    },
  );

  it.each(POLICY_CONSENT_AUDIT_CASES)(
    "$traceId: 同意受諾時に POLICY_CONSENT_ACCEPT 監査を出力する",
    async (greenCase) => {
      const hasAuditTrigger = normalizedInitSql.includes(
        `create or replace trigger ${greenCase.triggerName.toLowerCase()}`,
      );
      const hasAuditFunction = normalizedInitSql.includes(
        "create or replace function public.audit_policy_consents_insert()",
      );
      const hasAuditAction = normalizedInitSql.includes(`'${greenCase.requiredAuditAction.toLowerCase()}'`);

      expect(
        hasAuditTrigger && hasAuditFunction && hasAuditAction,
        `${greenCase.traceId}: ${greenCase.requiredAuditAction} 監査出力が必要`,
      ).toBe(true);
    },
  );
});
