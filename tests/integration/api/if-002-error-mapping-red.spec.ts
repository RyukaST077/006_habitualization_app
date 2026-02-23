import { describe, expect, it } from "vitest";

import { IF002_ERROR_SCENARIOS } from "./fixtures/if-002-error-scenarios";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-026 PR-003 IF-002 error mapping red tests", () => {
  it("IF-002: 403/409/500 の3系統シナリオを持つ", () => {
    const statuses = new Set(IF002_ERROR_SCENARIOS.map((scenario) => scenario.expectedStatus));
    const codes = new Set(IF002_ERROR_SCENARIOS.map((scenario) => scenario.expectedCode));

    expect(IF002_ERROR_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    expect(statuses.has(403)).toBe(true);
    expect(statuses.has(409)).toBe(true);
    expect(statuses.has(500)).toBe(true);
    expect(codes.has("FORBIDDEN")).toBe(true);
    expect(codes.has("DOMAIN_CONFLICT")).toBe(true);
    expect(codes.has("INTERNAL_ERROR")).toBe(true);
  });

  it("IF-002: 403 FORBIDDEN は本人外アクセスを前提にし DB 不変期待を持つ", () => {
    const forbidden = IF002_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 403);

    expect(forbidden).toBeDefined();
    expect(forbidden?.request.actorUserId).not.toBe(forbidden?.request.targetUserId);
    expect(forbidden?.expectDbUnchanged).toBe(true);
    expect(forbidden?.expectedCode).toBe("FORBIDDEN");
    expect(forbidden?.requirementId).toBe("FR-025");
  });

  it("IF-002: 409 DOMAIN_CONFLICT は archived 習慣チェックインを前提にする", () => {
    const conflict = IF002_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 409);

    expect(conflict).toBeDefined();
    expect(conflict?.request.body.habit_id).toBe("habit-archived-001");
    expect(conflict?.expectedCode).toBe("DOMAIN_CONFLICT");
    expect(conflict?.requirementId).toBe("FR-013");
  });

  it.each(IF002_ERROR_SCENARIOS)("$traceId: requirement_id を含む共通エラー構造を検証", (scenario) => {
    const harness = createIf002TestHarness();

    harness.assertErrorMapping(
      scenario.expectedStatus,
      {
        code: scenario.expectedCode,
        message: scenario.expectedMessage,
        trace_id: `trace-${scenario.traceId}`,
        requirement_id: scenario.requirementId,
      },
      {
        status: scenario.expectedStatus,
        code: scenario.expectedCode,
        requirementId: scenario.requirementId,
      },
    );
  });

  it("IF-002: 500 INTERNAL_ERROR は trace_id を返す期待を固定する", () => {
    const internal = IF002_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 500);
    const harness = createIf002TestHarness();

    expect(internal).toBeDefined();
    const target = internal!;
    const payload = {
      code: target.expectedCode,
      message: target.expectedMessage,
      trace_id: `trace-${target.traceId}`,
      requirement_id: target.requirementId,
    };

    harness.assertCommonErrorShape(payload, {
      code: "INTERNAL_ERROR",
      requirementId: target.requirementId,
    });
    expect(payload.trace_id).toContain("trace-");
  });

  it("red: エラーマッピングのAPIハーネス未実装のため実行で失敗する", async () => {
    const harness = createIf002TestHarness();
    const scenario = IF002_ERROR_SCENARIOS[0];

    const result = await harness.runErrorScenarioCase(scenario);
    expect(result.status).toBe(scenario.expectedStatus);
  });
});
