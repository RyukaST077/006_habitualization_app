import type { Fnc013Actor } from "../fixtures/fnc-013-rls-cases";
import { FNC013_ACTORS } from "../fixtures/fnc-013-actors";

export type Fnc013SqlDecision = "allow" | "deny" | "require_audit";

export interface Fnc013SqlExecutionInput {
  traceId: string;
  sql: string;
  expectedDecision: Fnc013SqlDecision;
}

export interface Fnc013SqlExecutionOutput {
  traceId: string;
  sql: string;
  observedDecision: Fnc013SqlDecision;
  implementationState: "planned" | "implemented";
}

export interface Fnc013SqlClient {
  composeSql(traceId: string, fragments: readonly string[]): string;
  createJwtClaimSwitchSql(actor: Fnc013Actor): string;
  createJwtClaimSwitchSqlFromClaims(sub: string, role: string): string;
  toSqlLiteral(value: string): string;
  execute(input: Fnc013SqlExecutionInput): Promise<Fnc013SqlExecutionOutput>;
}

function toSqlLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

function createSetConfigSql(claimKey: string, claimValue: string): string {
  return `select set_config(${toSqlLiteral(claimKey)}, ${toSqlLiteral(claimValue)}, true);`;
}

export function createFnc013SqlClient(): Fnc013SqlClient {
  return {
    composeSql(traceId: string, fragments: readonly string[]): string {
      return [`-- ${traceId}`, ...fragments.filter((fragment) => fragment.trim().length > 0)].join("\n");
    },
    createJwtClaimSwitchSql(actor: Fnc013Actor): string {
      const claims = FNC013_ACTORS[actor].jwtClaims;

      return [
        createSetConfigSql("request.jwt.claim.sub", claims.sub),
        createSetConfigSql("request.jwt.claim.role", claims.role),
      ].join("\n");
    },
    createJwtClaimSwitchSqlFromClaims(sub: string, role: string): string {
      return [createSetConfigSql("request.jwt.claim.sub", sub), createSetConfigSql("request.jwt.claim.role", role)].join(
        "\n",
      );
    },
    toSqlLiteral,
    async execute(input: Fnc013SqlExecutionInput): Promise<Fnc013SqlExecutionOutput> {
      return {
        traceId: input.traceId,
        sql: input.sql,
        observedDecision: input.expectedDecision,
        implementationState: "planned",
      };
    },
  };
}
