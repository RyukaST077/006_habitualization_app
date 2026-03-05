import { describe, expect, it } from "vitest";

import { runPlannedCase } from "../../../src/server/application/if-002/case-runner";

interface AnalyticsSummaryBody {
  analytics: {
    completion_rate: number;
    best_streak: number;
  };
}

function extractAnalytics(payload: unknown): { completion_rate: number; best_streak: number } {
  return (payload as AnalyticsSummaryBody).analytics;
}

describe("T-027 C-004 IF-002 analytics summary red tests", () => {
  it("GET /api/analytics/user-summary: range_days=7 で completion_rate と best_streak を返す", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/ANALYTICS/FR-015/range-7-summary",
      endpoint: "/api/analytics/user-summary",
      method: "GET",
      requirementId: "FR-015",
      expectedMessage: "analytics summary success",
      request: {
        actorUserId: "user-red-001",
        body: {
          range_days: 7,
          base_date: "2026-03-04",
        },
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.code).toBe("SUCCESS");

    const analytics = extractAnalytics(result.body as unknown);
    expect(analytics.completion_rate).toBe(71.4);
    expect(analytics.best_streak).toBe(3);
  });

  it("GET /api/analytics/user-summary: range_days が 7/30/90 以外なら 400", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/ANALYTICS/FR-015/invalid-range-days",
      endpoint: "/api/analytics/user-summary",
      method: "GET",
      requirementId: "FR-015",
      expectedMessage: "validation error",
      request: {
        actorUserId: "user-red-001",
        body: {
          range_days: 14,
          base_date: "2026-03-04",
        },
      },
    });

    expect(result.status).toBe(400);
    expect(result.body.code).toBe("VALIDATION_ERROR");
  });

  it("GET /api/analytics/user-summary: データ0件時はゼロ値応答", async () => {
    const result = await runPlannedCase({
      traceId: "IF-002/ANALYTICS/FR-015/empty-zero-response",
      endpoint: "/api/analytics/user-summary",
      method: "GET",
      requirementId: "FR-015",
      expectedMessage: "analytics summary success with zero values",
      request: {
        actorUserId: "user-red-003",
        body: {
          range_days: 30,
          base_date: "2026-03-04",
        },
      },
    });

    expect(result.status).toBe(200);

    const analytics = extractAnalytics(result.body as unknown);
    expect(analytics.completion_rate).toBe(0);
    expect(analytics.best_streak).toBe(0);
  });
});
