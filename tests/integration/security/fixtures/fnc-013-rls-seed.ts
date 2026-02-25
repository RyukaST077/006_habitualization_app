import type { Fnc013SelfScopeAction, Fnc013SelfScopeTable } from "../helpers/fnc-013-rls-test-harness";

export type Fnc013RlsUserLabel = "USER-A" | "USER-B";

export interface Fnc013RlsSeedUser {
  label: Fnc013RlsUserLabel;
  userId: string;
}

export interface Fnc013SelfScopeSeedRow {
  table: Fnc013SelfScopeTable;
  owner: Fnc013RlsUserLabel;
  userId: string;
  rowId: string;
}

export interface Fnc013SelfScopeSeedScenario {
  traceId: string;
  requirementId: "FR-025";
  acceptanceId: "AC-025";
  actor: "USER-A";
  targetOwner: Fnc013RlsUserLabel;
  table: Fnc013SelfScopeTable;
  action: Fnc013SelfScopeAction;
  expectedDecision: "allow" | "deny";
  expectedCode?: "FORBIDDEN";
}

export const FNC013_RLS_SEED_USERS: Record<Fnc013RlsUserLabel, Fnc013RlsSeedUser> = {
  "USER-A": { label: "USER-A", userId: "00000000-0000-4000-8000-0000000000aa" },
  "USER-B": { label: "USER-B", userId: "00000000-0000-4000-8000-0000000000bb" },
};

export const FNC013_SELF_SCOPE_TABLES: Fnc013SelfScopeTable[] = [
  "profiles",
  "habits",
  "habit_logs",
  "policy_consents",
];

export const FNC013_SELF_SCOPE_SEED_ROWS: Fnc013SelfScopeSeedRow[] = FNC013_SELF_SCOPE_TABLES.flatMap((table) => [
  {
    table,
    owner: "USER-A",
    userId: FNC013_RLS_SEED_USERS["USER-A"].userId,
    rowId: `${table}-seed-user-a`,
  },
  {
    table,
    owner: "USER-B",
    userId: FNC013_RLS_SEED_USERS["USER-B"].userId,
    rowId: `${table}-seed-user-b`,
  },
]);

const ACTIONS: Fnc013SelfScopeAction[] = ["select", "update"];

export const FNC013_SELF_SCOPE_ALLOW_SCENARIOS: Fnc013SelfScopeSeedScenario[] = FNC013_SELF_SCOPE_TABLES.flatMap(
  (table) =>
    ACTIONS.map((action) => ({
      traceId: `FNC-013/FR-025/AC-025/${table}/${action}/USER-A-self-allow`,
      requirementId: "FR-025" as const,
      acceptanceId: "AC-025" as const,
      actor: "USER-A" as const,
      targetOwner: "USER-A" as const,
      table,
      action,
      expectedDecision: "allow" as const,
    })),
);

export const FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS: Fnc013SelfScopeSeedScenario[] = FNC013_SELF_SCOPE_TABLES.flatMap(
  (table) =>
    ACTIONS.map((action) => ({
      traceId: `FNC-013/FR-025/AC-025/${table}/${action}/USER-A-to-USER-B-FORBIDDEN`,
      requirementId: "FR-025" as const,
      acceptanceId: "AC-025" as const,
      actor: "USER-A" as const,
      targetOwner: "USER-B" as const,
      table,
      action,
      expectedDecision: "deny" as const,
      expectedCode: "FORBIDDEN" as const,
    })),
);
