import { describe, expect, it } from "vitest";

import { createIf002TestHarness } from "../api/helpers/if-002-test-harness";

describe("T-025 C-005 FNC-006 idempotency race regression", () => {
  it("FR-011/FR-012: 同時2リクエストでも +1/+0 で冪等に収束する", async () => {
    const harness = createIf002TestHarness();
    const request = {
      actorUserId: "user-red-001",
      body: {
        habit_id: "habit-red-001",
        log_date: "2026-03-02",
      },
    };

    const [first, second] = await Promise.all([
      harness.runPlannedCase({
        traceId: "IF-002/CHECKINS/FR-011/race-register-1",
        endpoint: "/api/checkins",
        method: "POST",
        requirementId: "FR-011",
        expectedMessage: "race register 1",
        request,
      }),
      harness.runPlannedCase({
        traceId: "IF-002/CHECKINS/FR-012/race-register-2",
        endpoint: "/api/checkins",
        method: "POST",
        requirementId: "FR-012",
        expectedMessage: "race register 2",
        request,
      }),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    harness.assertCheckinLogDate(first.body, "2026-03-02");
    harness.assertCheckinLogDate(second.body, "2026-03-02");

    const idempotentResults = [first.body.checkin?.idempotent, second.body.checkin?.idempotent].sort();
    expect(idempotentResults).toEqual([false, true]);
  });
});
