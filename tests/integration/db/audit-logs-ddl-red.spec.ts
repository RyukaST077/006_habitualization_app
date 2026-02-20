import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  AUDIT_LOG_REQUIRED_FIELDS_RED_CASES,
  AUDIT_LOG_RESULT_CONSTRAINT_RED_CASES,
  AUDIT_METADATA_REQUIRED_RED_CASES,
} from "./fixtures/consent-audit-tables";
const initSql = readFileSync("supabase/migrations/00000000000000_init.sql", "utf8");
const normalizedInitSql = initSql.toLowerCase();
const POLICY_SETTINGS_AUDIT_METADATA_KEYS = ["old_version", "new_version", "policy_type"] as const;
const POLICY_SETTINGS_AUDIT_REQUIREMENT = "FR-026";

describe("T-021 PR-003 audit_logs DDL green tests", () => {
  it.each(AUDIT_LOG_RESULT_CONSTRAINT_RED_CASES)(
    "$traceId: result は success/failure のみ許可する",
    async (greenCase) => {
      const hasResultCheck = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} check`,
      ) && greenCase.requiredDefinitionFragments.every((fragment) =>
        normalizedInitSql.includes(fragment.toLowerCase()),
      );

      expect(hasResultCheck, `${greenCase.traceId}: result 制約に success/failure が必要`).toBe(true);
    },
  );

  it.each(AUDIT_LOG_REQUIRED_FIELDS_RED_CASES)(
    "$traceId: action/target_type/target_id の必須制約を満たす",
    async (greenCase) => {
      const hasRequiredCheck = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} check`,
      ) && greenCase.requiredDefinitionFragments.every((fragment) =>
        normalizedInitSql.includes(fragment.toLowerCase()),
      );
      const nullableRequiredColumns = greenCase.requiredColumns.filter(
        (columnName) =>
          !new RegExp(`${columnName}\\s+(?:varchar\\(\\d+\\)|text)\\s+not null`, "i").test(initSql),
      );

      expect(hasRequiredCheck, `${greenCase.traceId}: 必須項目チェック制約が必要`).toBe(true);
      expect(nullableRequiredColumns, `${greenCase.traceId}: 必須項目は NOT NULL が必要`).toHaveLength(0);
    },
  );

  it.each(AUDIT_METADATA_REQUIRED_RED_CASES)(
    "$traceId: policy_settings 更新監査で metadata_json に old/new/policy_type を強制する",
    async (greenCase) => {
      const hasMetadataConstraint = normalizedInitSql.includes(
        `constraint ${greenCase.constraintName.toLowerCase()} check`,
      ) && greenCase.requiredDefinitionFragments.every((fragment) =>
        normalizedInitSql.includes(fragment.toLowerCase()),
      );

      expect(
        hasMetadataConstraint,
        `${greenCase.traceId}: ${POLICY_SETTINGS_AUDIT_REQUIREMENT} metadata_json に ${POLICY_SETTINGS_AUDIT_METADATA_KEYS.join("/")} が必要`,
      ).toBe(true);
    },
  );
});
