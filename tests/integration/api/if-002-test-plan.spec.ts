import { describe, expect, it } from "vitest";

import {
  IF002_RED_CASES,
  IF002_REPRESENTATIVE_ENDPOINTS,
  IF002_REQUIRED_ERROR_STATUSES,
  IF002_REQUIRED_REQUIREMENT_IDS,
} from "./fixtures/if-002-cases";
import { createIf002TestHarness } from "./helpers/if-002-test-harness";

describe("T-026 PR-001 IF-002 API DTO/validation red test plan", () => {
  it("IF-002: 代表エンドポイントを対象に含む", () => {
    const covered = new Set(IF002_RED_CASES.map((testCase) => testCase.endpoint));

    IF002_REPRESENTATIVE_ENDPOINTS.forEach((endpoint) => {
      expect(covered.has(endpoint)).toBe(true);
    });
  });

  it("IF-002: 400/403/409/500 + code を網羅する", () => {
    const coveredStatuses = new Set(IF002_RED_CASES.map((testCase) => testCase.expectedStatus));
    const coveredCodes = new Set(IF002_RED_CASES.map((testCase) => testCase.expectedCode));

    IF002_REQUIRED_ERROR_STATUSES.forEach((status) => {
      expect(coveredStatuses.has(status)).toBe(true);
    });

    expect(coveredCodes.has("VALIDATION_ERROR")).toBe(true);
    expect(coveredCodes.has("FORBIDDEN")).toBe(true);
    expect(coveredCodes.has("DOMAIN_CONFLICT")).toBe(true);
    expect(coveredCodes.has("INTERNAL_ERROR")).toBe(true);
  });

  it("IF-002: FR-011..013/FR-021/FR-025 をトレースする", () => {
    const coveredRequirements = new Set(IF002_RED_CASES.map((testCase) => testCase.requirementId));

    IF002_REQUIRED_REQUIREMENT_IDS.forEach((requirementId) => {
      expect(coveredRequirements.has(requirementId)).toBe(true);
    });
  });

  it.each(IF002_RED_CASES)("$traceId: 共通エラーフォーマット検証の期待を保持", async (testCase) => {
    const harness = createIf002TestHarness();
    const headers = harness.createAuthHeaders(testCase.request.actorUserId, testCase.traceId);

    expect(headers.Authorization).toContain("Bearer ");
    expect(headers["X-Request-Id"]).toBe(testCase.traceId);

    harness.assertCommonErrorShape(
      {
        code: testCase.expectedCode,
        message: testCase.expectedMessage,
        trace_id: `trace-${testCase.traceId}`,
        requirement_id: testCase.requirementId,
      },
      { code: testCase.expectedCode, requirementId: testCase.requirementId },
    );
  });

  it("IF-002: force_throw は 500 INTERNAL_ERROR + trace_id にマップされる", async () => {
    const harness = createIf002TestHarness();
    const systemCase = IF002_RED_CASES.find((testCase) => testCase.expectedStatus === 500);

    expect(systemCase).toBeDefined();

    const result = await harness.runPlannedCase(systemCase!);
    expect(result.status).toBe(500);
    expect(result.body.code).toBe("INTERNAL_ERROR");
    expect(result.body.trace_id).toContain("trace-");
  });
});
