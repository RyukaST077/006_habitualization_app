import { describe, expect, it } from "vitest";

import {
  IF002_DTO_TARGET_ENDPOINTS,
  IF002_INVALID_PAYLOAD_CASES,
} from "./fixtures/if-002-invalid-payloads";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-026 PR-002 IF-002 DTO validation red tests", () => {
  it("IF-002: DTO検証対象エンドポイントをすべて含む", () => {
    const covered = new Set(IF002_INVALID_PAYLOAD_CASES.map((testCase) => testCase.endpoint));

    IF002_DTO_TARGET_ENDPOINTS.forEach((endpoint) => {
      expect(covered.has(endpoint)).toBe(true);
    });
  });

  it("IF-002: Habit作成/更新DTOの境界値失敗ケースを持つ", () => {
    const createCases = IF002_INVALID_PAYLOAD_CASES.filter(
      (testCase) => testCase.endpoint === "/api/habits" && testCase.method === "POST",
    );
    const updateCases = IF002_INVALID_PAYLOAD_CASES.filter(
      (testCase) => testCase.endpoint === "/api/habits/{id}" && testCase.method === "PATCH",
    );

    expect(createCases.length).toBeGreaterThanOrEqual(4);
    expect(updateCases.length).toBeGreaterThanOrEqual(2);
  });

  it("IF-002: 設定更新DTOで TZ/HH:mm 不正ケースを持つ", () => {
    const settingsCases = IF002_INVALID_PAYLOAD_CASES.filter(
      (testCase) => testCase.endpoint === "/api/settings/profile" && testCase.method === "PATCH",
    );

    expect(settingsCases.some((testCase) => testCase.request.body.timezone === "Mars/Olympus")).toBe(true);
    expect(settingsCases.some((testCase) => testCase.request.body.day_cutoff_time === "24:00")).toBe(true);
    expect(settingsCases.some((testCase) => testCase.request.body.day_cutoff_time === "9:00")).toBe(true);
  });

  it("IF-002: チェックイン取消DTOで必須/形式エラーケースを持つ", () => {
    const cancelCases = IF002_INVALID_PAYLOAD_CASES.filter(
      (testCase) => testCase.endpoint === "/api/checkins/{habitId}" && testCase.method === "DELETE",
    );

    expect(cancelCases.length).toBeGreaterThanOrEqual(3);
    expect(cancelCases.some((testCase) => testCase.expectedMessage === "habit_id is required")).toBe(true);
    expect(cancelCases.some((testCase) => testCase.expectedMessage === "now_utc is required")).toBe(true);
    expect(cancelCases.some((testCase) => testCase.expectedMessage === "now_utc must be iso-8601")).toBe(true);
  });

  it.each(IF002_INVALID_PAYLOAD_CASES)("$traceId: 400 VALIDATION_ERROR + trace_id を期待する", (testCase) => {
    const harness = createIf002TestHarness();
    const headers = harness.createAuthHeaders(testCase.request.actorUserId, testCase.traceId);

    expect(headers["X-Request-Id"]).toBe(testCase.traceId);
    expect(testCase.expectedStatus).toBe(400);
    expect(testCase.expectedCode).toBe("VALIDATION_ERROR");

    harness.assertCommonErrorShape(
      {
        code: testCase.expectedCode,
        message: testCase.expectedMessage,
        trace_id: `trace-${testCase.traceId}`,
        requirement_id: testCase.requirementId,
      },
      { code: "VALIDATION_ERROR", requirementId: testCase.requirementId },
    );
  });

  it("red: DTO検証のAPIハーネス未実装のため実行で失敗する", async () => {
    const harness = createIf002TestHarness();
    const dtoCase = IF002_INVALID_PAYLOAD_CASES[0];

    const result = await harness.runInvalidPayloadCase(dtoCase);
    expect(result.status).toBe(dtoCase.expectedStatus);
  });
});
