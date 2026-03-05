import { describe, expect, it } from "vitest";

import { runPlannedCase } from "../../../src/server/application/if-002/case-runner";

interface HistoryCalendarBody {
  history: {
    days: Array<{ date: string; status: string }>;
  };
}

function extractDays(payload: unknown): Array<{ date: string; status: string }> {
  return (payload as HistoryCalendarBody).history.days;
}

describe("T-027 C-003 IF-002 history calendar red tests", () => {
  it("FR-017: include_archived 未指定時は archived 習慣を除外して返す", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/HISTORY/FR-017/default-exclude-archived",
      endpoint: "/api/history/calendar",
      method: "GET",
      requirementId: "FR-017",
      expectedMessage: "history calendar success",
      request: {
        actorUserId: "user-red-001",
        body: {
          year_month: "2026-02",
        },
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.code).toBe("SUCCESS");

    const days = extractDays(result.body as unknown);
    expect(days).toHaveLength(28);
    expect(days.find((day) => day.date === "2026-02-01")?.status).toBe("checked");
    expect(days.find((day) => day.date === "2026-02-02")?.status).toBe("grace");
    expect(days.find((day) => day.date === "2026-02-05")?.status).toBe("missed");
  });

  it("FR-017: include_archived=true の場合は archived 習慣も含めて返す", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/HISTORY/FR-017/include-archived",
      endpoint: "/api/history/calendar",
      method: "GET",
      requirementId: "FR-017",
      expectedMessage: "history calendar success include archived",
      request: {
        actorUserId: "user-red-001",
        body: {
          year_month: "2026-02",
          include_archived: true,
        },
      },
    });

    expect(result.status).toBe(200);
    const days = extractDays(result.body as unknown);
    expect(days.find((day) => day.date === "2026-02-05")?.status).toBe("checked");
  });

  it("FR-017: year_month 不正時は 400 VALIDATION_ERROR", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/HISTORY/FR-017/invalid-year-month",
      endpoint: "/api/history/calendar",
      method: "GET",
      requirementId: "FR-017",
      expectedMessage: "validation error",
      request: {
        actorUserId: "user-red-001",
        body: {
          year_month: "2026/02",
        },
      },
    });

    expect(result.status).toBe(400);
    expect(result.body.code).toBe("VALIDATION_ERROR");
    expect(result.body.requirement_id).toBe("FR-017");
  });
});
