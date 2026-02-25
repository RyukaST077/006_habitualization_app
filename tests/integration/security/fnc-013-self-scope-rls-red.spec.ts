import { describe, expect, it } from "vitest";

import {
  FNC013_RLS_SEED_USERS,
  FNC013_SELF_SCOPE_ALLOW_SCENARIOS,
  FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS,
  FNC013_SELF_SCOPE_SEED_ROWS,
  FNC013_SELF_SCOPE_TABLES,
} from "./fixtures/fnc-013-rls-seed";
import { createFnc013RlsTestHarness } from "./helpers/fnc-013-rls-test-harness";

describe("T-028 PR-002 FR-025 self-scope RLS red tests", () => {
  it("profiles/habits/habit_logs/policy_consents の4テーブルを本人境界対象として固定する", () => {
    expect(FNC013_SELF_SCOPE_TABLES).toEqual([
      "profiles",
      "habits",
      "habit_logs",
      "policy_consents",
    ]);
    expect(
      FNC013_SELF_SCOPE_SEED_ROWS.every((row) => row.userId === FNC013_RLS_SEED_USERS[row.owner].userId),
    ).toBe(true);
  });

  it("FR-025: USER-A 自身データの参照/更新は許可される前提を持つ", () => {
    expect(FNC013_SELF_SCOPE_ALLOW_SCENARIOS.length).toBe(8);
    expect(FNC013_SELF_SCOPE_ALLOW_SCENARIOS.every((scenario) => scenario.requirementId === "FR-025")).toBe(true);
    expect(FNC013_SELF_SCOPE_ALLOW_SCENARIOS.every((scenario) => scenario.actor === "USER-A")).toBe(true);
    expect(FNC013_SELF_SCOPE_ALLOW_SCENARIOS.every((scenario) => scenario.targetOwner === "USER-A")).toBe(true);
  });

  it("FR-025: USER-A から USER-B データは FORBIDDEN で拒否される前提を持つ", () => {
    expect(FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS.length).toBe(8);
    expect(FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS.every((scenario) => scenario.targetOwner === "USER-B")).toBe(true);
    expect(
      FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS.every((scenario) => scenario.expectedCode === "FORBIDDEN"),
    ).toBe(true);
  });

  it.each(FNC013_SELF_SCOPE_ALLOW_SCENARIOS)(
    "$traceId: USER-A own data success path は auth.uid()=user_id 前提を含む",
    async (scenario) => {
      const harness = createFnc013RlsTestHarness();
      const result = await harness.executeSelfScopeScenario({
        traceId: scenario.traceId,
        actorUserId: FNC013_RLS_SEED_USERS[scenario.actor].userId,
        targetUserId: FNC013_RLS_SEED_USERS[scenario.targetOwner].userId,
        table: scenario.table,
        action: scenario.action,
        expectedDecision: scenario.expectedDecision,
      });

      expect(result.traceId).toBe(scenario.traceId);
      expect(result.observedDecision).toBe("allow");
      expect(result.sql).toContain("request.jwt.claim.sub");
      expect(result.sql).toContain(
        scenario.action === "select" ? `from public.${scenario.table}` : `update public.${scenario.table}`,
      );
      expect(result.sql).toContain("auth.uid() = user_id");
      expect(result.sql).toContain(FNC013_RLS_SEED_USERS[scenario.actor].userId);
    },
  );

  it.each(FNC013_SELF_SCOPE_FORBIDDEN_SCENARIOS)(
    "$traceId: USER-B data forbidden path は FORBIDDEN を返す前提を持つ",
    async (scenario) => {
      const harness = createFnc013RlsTestHarness();
      const result = await harness.executeSelfScopeScenario({
        traceId: scenario.traceId,
        actorUserId: FNC013_RLS_SEED_USERS[scenario.actor].userId,
        targetUserId: FNC013_RLS_SEED_USERS[scenario.targetOwner].userId,
        table: scenario.table,
        action: scenario.action,
        expectedDecision: scenario.expectedDecision,
        expectedCode: scenario.expectedCode,
      });

      expect(result.traceId).toContain("FR-025");
      expect(result.observedDecision).toBe("deny");
      expect(result.observedCode).toBe("FORBIDDEN");
      expect(result.sql).toContain("auth.uid() = user_id");
      expect(result.sql).toContain(FNC013_RLS_SEED_USERS["USER-B"].userId);
    },
  );

  it("red: 実DB未接続のため self-scope 実装状態は planned のまま失敗する", async () => {
    const harness = createFnc013RlsTestHarness();
    const scenario = FNC013_SELF_SCOPE_ALLOW_SCENARIOS[0];
    const result = await harness.executeSelfScopeScenario({
      traceId: scenario.traceId,
      actorUserId: FNC013_RLS_SEED_USERS[scenario.actor].userId,
      targetUserId: FNC013_RLS_SEED_USERS[scenario.targetOwner].userId,
      table: scenario.table,
      action: scenario.action,
      expectedDecision: scenario.expectedDecision,
    });

    expect(result.implementationState).toBe("implemented");
  });
});
