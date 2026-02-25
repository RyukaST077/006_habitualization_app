import { describe, expect, it } from "vitest";

import { T030_ACTORS, T030_COMMON_ROLE_ID } from "./fixtures/t-030-actors";
import { T030_APP_ERROR_SCENARIOS } from "./fixtures/t-030-app-error-scenarios";
import { createT030TraceId, isT030TraceId } from "./helpers/t-030-trace-utils";
import { createT030TestHarness } from "./helpers/t-030-test-harness";

describe("T-030 PR-002 AppError/trace_id common error red tests", () => {
  it("共通アクター fixture(USER-A/USER-B/ROLE-002) を再利用できる", () => {
    expect(T030_ACTORS["USER-A"].roleId).toBe(T030_COMMON_ROLE_ID);
    expect(T030_ACTORS["USER-B"].roleId).toBe(T030_COMMON_ROLE_ID);
  });

  it("403/409/500 と FORBIDDEN/DOMAIN_CONFLICT/INTERNAL_ERROR のシナリオを持つ", () => {
    const statuses = new Set(T030_APP_ERROR_SCENARIOS.map((scenario) => scenario.expectedStatus));
    const codes = new Set(T030_APP_ERROR_SCENARIOS.map((scenario) => scenario.expectedCode));

    expect(T030_APP_ERROR_SCENARIOS.length).toBeGreaterThanOrEqual(3);
    expect(statuses.has(403)).toBe(true);
    expect(statuses.has(409)).toBe(true);
    expect(statuses.has(500)).toBe(true);
    expect(codes.has("FORBIDDEN")).toBe(true);
    expect(codes.has("DOMAIN_CONFLICT")).toBe(true);
    expect(codes.has("INTERNAL_ERROR")).toBe(true);
  });

  it("403 FORBIDDEN は requirement_id=FR-025 を返す期待を固定する", () => {
    const forbidden = T030_APP_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 403);

    expect(forbidden).toBeDefined();
    expect(forbidden?.expectedCode).toBe("FORBIDDEN");
    expect(forbidden?.requirementId).toBe("FR-025");
  });

  it("409 DOMAIN_CONFLICT は業務競合 requirement_id を保持する期待を固定する", () => {
    const conflict = T030_APP_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 409);

    expect(conflict).toBeDefined();
    expect(conflict?.expectedCode).toBe("DOMAIN_CONFLICT");
    expect(conflict?.requirementId).toBe("FR-013");
  });

  it("500 INTERNAL_ERROR は trace_id 必須の期待を固定する", () => {
    const internal = T030_APP_ERROR_SCENARIOS.find((scenario) => scenario.expectedStatus === 500);
    const harness = createT030TestHarness();

    expect(internal).toBeDefined();
    const target = internal!;

    harness.assertAppErrorScenarioContract(target, {
      code: target.expectedCode,
      message: target.expectedMessage,
      trace_id: createT030TraceId(target.traceId),
      requirement_id: target.requirementId,
    });
  });

  it.each(T030_APP_ERROR_SCENARIOS)("$traceId: 共通エラー payload の code/message/trace_id/requirement_id 形状を検証", (scenario) => {
    const harness = createT030TestHarness();
    const traceId = createT030TraceId(scenario.traceId);

    harness.assertAppErrorScenarioContract(scenario, {
      code: scenario.expectedCode,
      message: scenario.expectedMessage,
      trace_id: traceId,
      requirement_id: scenario.requirementId,
    });
    expect(isT030TraceId(traceId)).toBe(true);
  });

  it("red: T-031 実装前のため AppError 共通エラーは未実装として失敗させる", () => {
    const harness = createT030TestHarness();

    expect(harness.getT031ImplementationState()).toBe("implemented");
  });
});
