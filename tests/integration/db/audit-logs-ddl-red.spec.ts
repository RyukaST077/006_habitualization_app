import { describe, expect, it } from "vitest";

import {
  AUDIT_LOG_REQUIRED_FIELDS_RED_CASES,
  AUDIT_LOG_RESULT_CONSTRAINT_RED_CASES,
  AUDIT_METADATA_REQUIRED_RED_CASES,
} from "./fixtures/consent-audit-tables";
import { createSchemaIntrospectionPort } from "./helpers/schema-introspection";

const schemaIntrospection = createSchemaIntrospectionPort();
const POLICY_SETTINGS_AUDIT_METADATA_KEYS = ["old_version", "new_version", "policy_type"] as const;
const POLICY_SETTINGS_AUDIT_REQUIREMENT = "FR-026";

describe("T-020 PR-003 audit_logs DDL red tests", () => {
  it.each(AUDIT_LOG_RESULT_CONSTRAINT_RED_CASES)(
    "$traceId: result は success/failure のみ許可する",
    async (redCase) => {
      const hasResultCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(hasResultCheck, `${redCase.traceId}: result 制約に success/failure が必要`).toBe(true);
    },
  );

  it.each(AUDIT_LOG_REQUIRED_FIELDS_RED_CASES)(
    "$traceId: action/target_type/target_id の必須制約を満たす",
    async (redCase) => {
      const hasRequiredCheck = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );
      const actual = await schemaIntrospection.getTableSchemaMetadata(redCase.tableName);
      const nullableRequiredColumns = redCase.requiredColumns.filter((columnName) => {
        const column = actual.columns.find((candidate) => candidate.name === columnName);
        return !column || column.isNullable;
      });

      expect(hasRequiredCheck, `${redCase.traceId}: 必須項目チェック制約が必要`).toBe(true);
      expect(nullableRequiredColumns, `${redCase.traceId}: 必須項目は NOT NULL が必要`).toHaveLength(0);
    },
  );

  it.each(AUDIT_METADATA_REQUIRED_RED_CASES)(
    "$traceId: policy_settings 更新監査で metadata_json に old/new/policy_type を強制する",
    async (redCase) => {
      const hasMetadataConstraint = await schemaIntrospection.hasCheckConstraint(
        redCase.tableName,
        redCase.constraintName,
        redCase.requiredDefinitionFragments,
      );

      expect(
        hasMetadataConstraint,
        `${redCase.traceId}: ${POLICY_SETTINGS_AUDIT_REQUIREMENT} metadata_json に ${POLICY_SETTINGS_AUDIT_METADATA_KEYS.join("/")} が必要`,
      ).toBe(true);
    },
  );
});
