import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  POLICY_SETTINGS_SERVICE_ROLE_UPDATE_CASES,
  POLICY_TYPE_CONSTRAINT_CASES,
} from "./fixtures/consent-audit-tables";

const initSql = readFileSync("supabase/migrations/00000000000000_init.sql", "utf8");
const normalizedInitSql = initSql.toLowerCase();

describe("T-021 PR-001 policy_settings DDL green tests", () => {
  it.each(POLICY_TYPE_CONSTRAINT_CASES.filter((greenCase) => greenCase.tableName === "policy_settings"))(
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

  it.each(POLICY_SETTINGS_SERVICE_ROLE_UPDATE_CASES)(
    "$traceId: service role 更新前提と更新監査トリガーを満たす",
    async (greenCase) => {
      const hasAuditTrigger = normalizedInitSql.includes(
        `create or replace trigger ${greenCase.requiredTriggerName.toLowerCase()}`,
      );
      const hasRlsEnable = normalizedInitSql.includes("alter table public.policy_settings enable row level security");
      const policyMatches = normalizedInitSql.match(/create policy\s+.+\s+on\s+public\.policy_settings/g) ?? [];
      expect(hasRlsEnable).toBe(greenCase.requiredRlsEnabled);
      expect(policyMatches).toHaveLength(greenCase.expectedRlsPolicyCount);
      expect(
        hasAuditTrigger,
        `${greenCase.traceId}: ${greenCase.requiredActorRole} 前提の更新監査トリガーが必要`,
      ).toBe(true);
    },
  );
});
