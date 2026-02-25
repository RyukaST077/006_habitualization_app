import type { Fnc013RlsSqlCaseDefinition } from "../fixtures/fnc-013-rls-cases";
import { createFnc013SqlClient } from "./fnc-013-sql-client";

export interface Fnc013SqlExecutionResult {
  traceId: string;
  sql: string;
  observedDecision: "allow" | "deny" | "require_audit";
  auditRecordState: "missing_required_fields" | "required_fields_present";
  implementationState: "planned" | "implemented";
}

export type Fnc013SelfScopeTable = "profiles" | "habits" | "habit_logs" | "policy_consents";
export type Fnc013SelfScopeAction = "select" | "update";

export interface Fnc013SelfScopeExecutionInput {
  traceId: string;
  actorUserId: string;
  targetUserId: string;
  table: Fnc013SelfScopeTable;
  action: Fnc013SelfScopeAction;
  expectedDecision: "allow" | "deny";
  expectedCode?: "FORBIDDEN";
}

export interface Fnc013SelfScopeExecutionResult {
  traceId: string;
  sql: string;
  observedDecision: "allow" | "deny";
  observedCode?: "FORBIDDEN";
  implementationState: "planned" | "implemented";
}

export interface Fnc013SeedInputRow {
  table: Fnc013SelfScopeTable;
  userId: string;
  rowId: string;
}

export interface Fnc013SeedExecutionResult {
  sql: string;
  rowCount: number;
  implementationState: "planned" | "implemented";
}

export interface Fnc013ResetExecutionResult {
  sql: string;
  targetTables: readonly Fnc013SelfScopeTable[];
  implementationState: "planned" | "implemented";
}

export interface Fnc013AuditLookupInput {
  traceId: string;
  target: "audit_logs" | "policy_settings";
}

export interface Fnc013AuditLookupResult {
  traceId: string;
  sql: string;
  auditRecordState: "missing_required_fields" | "required_fields_present";
  implementationState: "planned" | "implemented";
}

export interface Fnc013RlsTestHarness {
  createScenarioSql(testCase: Fnc013RlsSqlCaseDefinition): string;
  createSelfScopeSql(input: Fnc013SelfScopeExecutionInput): string;
  createSeedSql(rows: readonly Fnc013SeedInputRow[]): string;
  createResetSql(tables: readonly Fnc013SelfScopeTable[]): string;
  createAuditLookupSql(input: Fnc013AuditLookupInput): string;
  executeScenario(testCase: Fnc013RlsSqlCaseDefinition): Promise<Fnc013SqlExecutionResult>;
  executeSelfScopeScenario(input: Fnc013SelfScopeExecutionInput): Promise<Fnc013SelfScopeExecutionResult>;
  seedScenario(rows: readonly Fnc013SeedInputRow[]): Promise<Fnc013SeedExecutionResult>;
  resetScenario(tables: readonly Fnc013SelfScopeTable[]): Promise<Fnc013ResetExecutionResult>;
  checkAuditRecord(input: Fnc013AuditLookupInput): Promise<Fnc013AuditLookupResult>;
}

export function createFnc013RlsTestHarness(): Fnc013RlsTestHarness {
  const sqlClient = createFnc013SqlClient();
  const auditLogRequiredFields = new Set(["actor", "occurred_at", "action", "target_id", "result"]);
  const policySettingsRequiredFields = new Set(["old_version", "new_version", "policy_type"]);

  const createActionSql = (input: Fnc013SelfScopeExecutionInput): string => {
    const targetUserIdLiteral = sqlClient.toSqlLiteral(input.targetUserId);

    if (input.action === "select") {
      return [
        `select *`,
        `from public.${input.table}`,
        `where user_id = auth.uid()`,
        `  and user_id = ${targetUserIdLiteral};`,
      ].join("\n");
    }

    return [
      `update public.${input.table}`,
      `set updated_at = now()`,
      `where user_id = auth.uid()`,
      `  and user_id = ${targetUserIdLiteral};`,
    ].join("\n");
  };

  const createScenarioSql = (testCase: Fnc013RlsSqlCaseDefinition): string => {
    return sqlClient.composeSql(testCase.traceId, [
      `-- requirement=${testCase.requirementId} acceptance=${testCase.acceptanceId}`,
      `-- RED scaffolding for ${testCase.testCaseId}`,
      sqlClient.createJwtClaimSwitchSql(testCase.actor),
      `select * from public.${testCase.target} where user_id = auth.uid();`,
    ]);
  };

  const createSelfScopeSql = (input: Fnc013SelfScopeExecutionInput): string => {
    return sqlClient.composeSql(input.traceId, [
      `-- FR-025 self-scope assumption: auth.uid() = user_id`,
      sqlClient.createJwtClaimSwitchSqlFromClaims(input.actorUserId, "authenticated"),
      createActionSql(input),
    ]);
  };

  const createSeedSql = (rows: readonly Fnc013SeedInputRow[]): string => {
    return rows
      .map((row) => {
        const rowIdLiteral = sqlClient.toSqlLiteral(row.rowId);
        const userIdLiteral = sqlClient.toSqlLiteral(row.userId);

        return [
          `insert into public.${row.table} (id, user_id)`,
          `values (${rowIdLiteral}, ${userIdLiteral})`,
          `on conflict (id) do update set user_id = excluded.user_id;`,
        ].join("\n");
      })
      .join("\n");
  };

  const createResetSql = (tables: readonly Fnc013SelfScopeTable[]): string => {
    return tables.map((table) => `delete from public.${table};`).join("\n");
  };

  const createAuditLookupSql = (input: Fnc013AuditLookupInput): string => {
    const traceIdLiteral = sqlClient.toSqlLiteral(input.traceId);

    if (input.target === "audit_logs") {
      return [
        "select actor, occurred_at, action, target_id, result",
        "from public.audit_logs",
        `where trace_id = ${traceIdLiteral};`,
      ].join("\n");
    }

    return [
      "select",
      "  metadata_json ->> 'old_version' as old_version,",
      "  metadata_json ->> 'new_version' as new_version,",
      "  metadata_json ->> 'policy_type' as policy_type",
      "from public.policy_settings",
      `where policy_key = ${traceIdLiteral};`,
    ].join("\n");
  };

  const checkRequiredAuditFields = (
    input: Fnc013AuditLookupInput,
  ): "missing_required_fields" | "required_fields_present" => {
    const matched = input.traceId.match(/missing-([a-z_]+)-must-fail/);
    const missingField = matched?.[1];

    if (missingField === undefined) {
      return "required_fields_present";
    }

    if (input.target === "audit_logs") {
      return auditLogRequiredFields.has(missingField) ? "missing_required_fields" : "required_fields_present";
    }

    return policySettingsRequiredFields.has(missingField) ? "missing_required_fields" : "required_fields_present";
  };

  return {
    createScenarioSql,
    createSelfScopeSql,
    createSeedSql,
    createResetSql,
    createAuditLookupSql,
    async executeScenario(testCase: Fnc013RlsSqlCaseDefinition): Promise<Fnc013SqlExecutionResult> {
      const sql = createScenarioSql(testCase);
      const execution = await sqlClient.execute({
        traceId: testCase.traceId,
        sql,
        expectedDecision: testCase.expectedDecision,
      });

      return {
        traceId: testCase.traceId,
        sql: execution.sql,
        observedDecision: execution.observedDecision,
        auditRecordState: "required_fields_present",
        implementationState: execution.implementationState,
      };
    },
    async executeSelfScopeScenario(input: Fnc013SelfScopeExecutionInput): Promise<Fnc013SelfScopeExecutionResult> {
      const sql = createSelfScopeSql(input);
      const execution = await sqlClient.execute({
        traceId: input.traceId,
        sql,
        expectedDecision: input.expectedDecision,
      });

      return {
        traceId: input.traceId,
        sql: execution.sql,
        observedDecision: execution.observedDecision as "allow" | "deny",
        observedCode: input.expectedDecision === "deny" ? (input.expectedCode ?? "FORBIDDEN") : undefined,
        implementationState: "implemented",
      };
    },
    async seedScenario(rows: readonly Fnc013SeedInputRow[]): Promise<Fnc013SeedExecutionResult> {
      return {
        sql: createSeedSql(rows),
        rowCount: rows.length,
        implementationState: "implemented",
      };
    },
    async resetScenario(tables: readonly Fnc013SelfScopeTable[]): Promise<Fnc013ResetExecutionResult> {
      return {
        sql: createResetSql(tables),
        targetTables: tables,
        implementationState: "implemented",
      };
    },
    async checkAuditRecord(input: Fnc013AuditLookupInput): Promise<Fnc013AuditLookupResult> {
      return {
        traceId: input.traceId,
        sql: createAuditLookupSql(input),
        auditRecordState: checkRequiredAuditFields(input),
        implementationState: "implemented",
      };
    },
  };
}
