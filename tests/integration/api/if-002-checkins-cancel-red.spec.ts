import { describe, expect, it } from "vitest";

import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-026 C-003 IF-002 checkins cancel red tests", () => {
  it("FR-014: /api/checkins/{habitId} は当日取消に成功する", async () => {
    const harness = createIf002TestHarness();

    await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-014/register-before-cancel-success",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-011",
      expectedMessage: "register for cancel",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          log_date: "2026-03-11",
          now_utc: "2026-03-11T12:00:00.000Z",
        },
      },
    });

    const result = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-014/cancel-same-day-success",
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: "FR-014",
      expectedMessage: "cancel today checkin",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          now_utc: "2026-03-11T10:00:00.000Z",
        },
      },
    });

    expect(result.status).toBe(200);
    harness.assertCheckinCanceled(result.body, true);
    harness.assertCheckinLogDate(result.body, "2026-03-11");
  });

  it("FR-014: 当日外取消は 409 DOMAIN_CONFLICT", async () => {
    const harness = createIf002TestHarness();

    await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-014/register-before-cancel-outside-day",
      endpoint: "/api/checkins",
      method: "POST",
      requirementId: "FR-011",
      expectedMessage: "register for outside-day cancel",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          log_date: "2026-03-12",
          now_utc: "2026-03-12T12:00:00.000Z",
        },
      },
    });

    const result = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-014/cancel-outside-day-conflict",
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: "FR-014",
      expectedMessage: "cancel outside day",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-red-001",
          now_utc: "2026-03-13T12:00:00.000Z",
        },
      },
    });

    harness.assertErrorMapping(result.status, result.body, {
      status: 409,
      code: "DOMAIN_CONFLICT",
      requirementId: "FR-014",
    });
  });

  it("FR-025: 他ユーザー習慣の取消は 403 FORBIDDEN", async () => {
    const harness = createIf002TestHarness();

    const result = await harness.runPlannedCase({
      traceId: "IF-002/CHECKINS/FR-025/cancel-other-user-habit-forbidden",
      endpoint: "/api/checkins/{habitId}",
      method: "DELETE",
      requirementId: "FR-025",
      expectedMessage: "cancel other user habit forbidden",
      request: {
        actorUserId: "user-red-001",
        body: {
          habit_id: "habit-user-red-002",
          now_utc: "2026-03-12T12:00:00.000Z",
        },
      },
    });

    expect(result.status).toBe(403);
    harness.assertForbiddenError(result.body, "FR-025");
  });
});
