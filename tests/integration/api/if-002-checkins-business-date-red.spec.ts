import { describe, expect, it } from "vitest";

import { IF002_CHECKINS_BUSINESS_DATE_RED_CASES } from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-042 C-003 IF-002 checkins business date red tests", () => {
  it("FR-010/AC-010: 同一 nowUtc でも USER-A(Asia/Tokyo) と USER-B(UTC) で log_date が異なる", async () => {
    const harness = createIf002TestHarness();
    const testCase = IF002_CHECKINS_BUSINESS_DATE_RED_CASES[0];
    const [userA, userB] = testCase.actors;

    expect(userA.actorLabel).toBe("USER-A");
    expect(userA.timezone).toBe("Asia/Tokyo");
    expect(userB.actorLabel).toBe("USER-B");
    expect(userB.timezone).toBe("UTC");
    expect(testCase.endpoint).toBe("/api/checkins");
    expect(testCase.nowUtc).toBe("2026-03-01T18:00:00Z");
    expect(userA.expectedLogDate).not.toBe(userB.expectedLogDate);

    const userAResult = await harness.runPlannedCase({
      traceId: `${testCase.traceId}/USER-A`,
      endpoint: testCase.endpoint,
      method: testCase.method,
      requirementId: testCase.requirementId,
      expectedMessage: "checkin accepted with business date resolved by timezone/cutoff",
      request: {
        actorUserId: userA.actorUserId,
        body: {
          habit_id: testCase.request.habitId,
          now_utc: testCase.nowUtc,
          timezone: userA.timezone,
          day_cutoff_time: userA.dayCutoffTime,
          log_date: userA.expectedLogDate,
        },
      },
    });

    const userBResult = await harness.runPlannedCase({
      traceId: `${testCase.traceId}/USER-B`,
      endpoint: testCase.endpoint,
      method: testCase.method,
      requirementId: testCase.requirementId,
      expectedMessage: "checkin accepted with business date resolved by timezone/cutoff",
      request: {
        actorUserId: userB.actorUserId,
        body: {
          habit_id: testCase.request.habitId,
          now_utc: testCase.nowUtc,
          timezone: userB.timezone,
          day_cutoff_time: userB.dayCutoffTime,
          log_date: userB.expectedLogDate,
        },
      },
    });

    expect(userAResult.status).toBe(201);
    expect(userBResult.status).toBe(201);
    expect(userAResult.body.requirement_id).toBe("FR-010");
    expect(userBResult.body.requirement_id).toBe("FR-010");
    harness.assertCheckinLogDate(userAResult.body, userA.expectedLogDate);
    harness.assertCheckinLogDate(userBResult.body, userB.expectedLogDate);
    expect(userA.expectedLogDate).not.toBe(userB.expectedLogDate);
  });
});
