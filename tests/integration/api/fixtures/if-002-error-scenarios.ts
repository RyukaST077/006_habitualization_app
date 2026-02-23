import type { If002Method, If002RequirementId } from "./if-002-cases";

export interface If002ErrorScenario {
  traceId: string;
  title: string;
  endpoint: "/api/checkins" | "/api/habits";
  method: If002Method;
  requirementId: If002RequirementId;
  expectedStatus: 403 | 409 | 500;
  expectedCode: "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
  expectedMessage: string;
  expectDbUnchanged: boolean;
  request: {
    actorUserId: string;
    targetUserId?: string;
    body: Record<string, unknown>;
  };
}

export const IF002_ERROR_SCENARIOS: If002ErrorScenario[] = [
  {
    traceId: "IF-002/AUTHZ/FR-025/checkins/other-user-access-forbidden",
    title: "本人外アクセスは 403 FORBIDDEN を返す",
    endpoint: "/api/checkins",
    method: "POST",
    requirementId: "FR-025",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    expectedMessage: "access denied",
    expectDbUnchanged: true,
    request: {
      actorUserId: "user-red-001",
      targetUserId: "user-red-002",
      body: { habit_id: "habit-user-red-002", log_date: "2026-02-23" },
    },
  },
  {
    traceId: "IF-002/DOMAIN/FR-013/checkins/archived-habit-domain-conflict",
    title: "archived習慣へのチェックインは 409 DOMAIN_CONFLICT を返す",
    endpoint: "/api/checkins",
    method: "POST",
    requirementId: "FR-013",
    expectedStatus: 409,
    expectedCode: "DOMAIN_CONFLICT",
    expectedMessage: "archived habit cannot be checked in",
    expectDbUnchanged: true,
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-archived-001", log_date: "2026-02-23" },
    },
  },
  {
    traceId: "IF-002/SYSTEM/FR-011/habits/unexpected-exception-internal-error",
    title: "予期せぬ例外は 500 INTERNAL_ERROR + trace_id に変換される",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-011",
    expectedStatus: 500,
    expectedCode: "INTERNAL_ERROR",
    expectedMessage: "unexpected error",
    expectDbUnchanged: false,
    request: {
      actorUserId: "user-red-001",
      body: { name: "read", display_order: 10, force_throw: true },
    },
  },
];
