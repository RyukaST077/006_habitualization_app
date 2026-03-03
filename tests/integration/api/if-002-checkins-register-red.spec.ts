import { describe, expect, it } from "vitest";

import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-025 C-003 IF-002 checkins register red tests", () => {
  it("FR-011/FR-012: /api/checkins 成功時に idempotent と log_date を返す", async () => {
    const harness = createIf002TestHarness();
    const request = {
      actorUserId: "user-red-001",
      body: {
        habit_id: "habit-red-001",
        log_date: "2026-03-02",
      },
    };

    const first = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-011/register-success",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-011",
      expectedMessage: "checkin success",
      request,
    });
    const second = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-012/register-idempotent",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-012",
      expectedMessage: "checkin idempotent success",
      request,
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    harness.assertCheckinLogDate(first.body, "2026-03-02");
    harness.assertCheckinLogDate(second.body, "2026-03-02");
    harness.assertCheckinIdempotent(first.body, false);
    harness.assertCheckinIdempotent(second.body, true);
  });

  it("FR-025: 他ユーザー habit 指定時は 403 FORBIDDEN", async () => {
    const harness = createIf002TestHarness();

    const result = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-025/other-user-habit-forbidden",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-025",
      expectedMessage: "forbidden",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-user-red-002",
          log_date: "2026-03-02",
        },
      },
    });

    expect(result.status).toBe(403);
    harness.assertForbiddenError(result.body, "FR-025");
  });

  it("FR-013: archived 習慣時は 409 DOMAIN_CONFLICT", async () => {
    const harness = createIf002TestHarness();

    const result = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-013/archived-habit-conflict",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-013",
      expectedMessage: "archived conflict",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-archived-001",
          log_date: "2026-03-02",
        },
      },
    });

    harness.assertErrorMapping(result.status, result.body, {
      status: 409,
      code: "DOMAIN_CONFLICT",
      requirementId: "FR-013",
    });
  });
});
