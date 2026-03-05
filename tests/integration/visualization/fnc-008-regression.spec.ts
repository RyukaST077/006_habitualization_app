import { describe, expect, it } from "vitest";

import { FNC008_RED_CASES, FNC008_REQUIRED_REQUIREMENT_IDS } from "./fixtures/fnc-008-cases";

const T027_FNC008_REGRESSION_GATE_COMMAND =
  "npm run test -- tests/integration/visualization/fnc-008-regression.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts";
const T027_COMPLETION_GATE_COMMAND =
  "npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts tests/unit/server/streak-service.spec.ts tests/unit/server/history-service.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck";

const T055_API_CONTRACT = {
  ownerTaskId: "T-055",
  endpoint: "/api/history/calendar",
  method: "GET",
  request: {
    year_month: "YYYY-MM",
    include_archived: "optional boolean (default false)",
    habit_id: "optional string",
  },
  response: {
    code: "SUCCESS",
    requirement_id: "FR-017",
    history: {
      days: "Array<{ date: YYYY-MM-DD; status: checked|missed|grace }>",
    },
  },
  regressionSpecPath: "tests/integration/api/if-002-history-calendar-red.spec.ts",
} as const;

const T057_API_CONTRACT = {
  ownerTaskId: "T-057",
  endpoint: "/api/analytics/user-summary",
  method: "GET",
  request: {
    range_days: "7|30|90",
    base_date: "optional YYYY-MM-DD",
  },
  response: {
    code: "SUCCESS",
    requirement_id: "FR-015",
    analytics: {
      completion_rate: "number",
      best_streak: "number",
    },
  },
  regressionSpecPath: "tests/integration/api/if-002-analytics-summary-red.spec.ts",
} as const;

describe("T-027 C-005 FNC-008 regression gate", () => {
  it("FR-015〜FR-017 の回帰観点を1つのゲートへ集約する", () => {
    const coveredRequirements = new Set(FNC008_RED_CASES.map((testCase) => testCase.requirementId));
    FNC008_REQUIRED_REQUIREMENT_IDS.forEach((requirementId) => {
      expect(coveredRequirements.has(requirementId)).toBe(true);
    });
    expect(coveredRequirements.size).toBe(FNC008_REQUIRED_REQUIREMENT_IDS.length);
  });

  it("T-027 完了コマンド（test/typecheck）を固定する", () => {
    expect(T027_FNC008_REGRESSION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/visualization/fnc-008-regression.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts",
    );
    expect(T027_COMPLETION_GATE_COMMAND).toBe(
      "npm run test -- tests/integration/visualization/fnc-008-test-plan.spec.ts tests/unit/server/streak-service.spec.ts tests/unit/server/history-service.spec.ts tests/integration/api/if-002-history-calendar-red.spec.ts tests/integration/api/if-002-analytics-summary-red.spec.ts && npm run typecheck",
    );
  });

  it("T-055/T-057 が依存する IF-002 API契約を明示する", () => {
    expect(T055_API_CONTRACT.ownerTaskId).toBe("T-055");
    expect(T055_API_CONTRACT.endpoint).toBe("/api/history/calendar");
    expect(T055_API_CONTRACT.method).toBe("GET");
    expect(T055_API_CONTRACT.request.year_month).toBe("YYYY-MM");
    expect(T055_API_CONTRACT.request.include_archived).toContain("default false");
    expect(T055_API_CONTRACT.response.history.days).toContain("checked|missed|grace");
    expect(T055_API_CONTRACT.regressionSpecPath).toBe("tests/integration/api/if-002-history-calendar-red.spec.ts");

    expect(T057_API_CONTRACT.ownerTaskId).toBe("T-057");
    expect(T057_API_CONTRACT.endpoint).toBe("/api/analytics/user-summary");
    expect(T057_API_CONTRACT.method).toBe("GET");
    expect(T057_API_CONTRACT.request.range_days).toBe("7|30|90");
    expect(T057_API_CONTRACT.response.analytics.completion_rate).toBe("number");
    expect(T057_API_CONTRACT.response.analytics.best_streak).toBe("number");
    expect(T057_API_CONTRACT.regressionSpecPath).toBe("tests/integration/api/if-002-analytics-summary-red.spec.ts");
  });

  it("完了条件に UIテスト/Playwright E2E/T-031 横断試験を含めない", () => {
    const gateText = `${T027_FNC008_REGRESSION_GATE_COMMAND} ${T027_COMPLETION_GATE_COMMAND}`;
    ["SCR-005", "SCR-006", "tests/e2e", "playwright", "Playwright", "T-031"].forEach((excludedTerm) => {
      expect(gateText).not.toContain(excludedTerm);
    });
  });
});
