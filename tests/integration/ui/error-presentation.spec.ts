import { describe, expect, it } from "vitest";
import { COMMON_UI_ERROR_CASES } from "../../helpers/fixtures";

type CommonErrorCode = "VALIDATION_ERROR" | "FORBIDDEN" | "DOMAIN_CONFLICT" | "INTERNAL_ERROR";
type ErrorStatus = 400 | 403 | 409 | 500;

type IntegratedErrorPresentation = {
  status: ErrorStatus;
  code: CommonErrorCode;
  message: string;
  statusLabel: string;
  traceIdLabel: "trace_id";
  visibleTraceId: string | null;
  internalDetail: string | null;
};

function resolveIntegratedErrorPresentation(status: ErrorStatus, code: CommonErrorCode): IntegratedErrorPresentation {
  return {
    status,
    code,
    message: "NOT_IMPLEMENTED",
    statusLabel: String(status),
    traceIdLabel: "trace_id",
    visibleTraceId: null,
    internalDetail: "Error: stack trace should never be shown",
  };
}

describe("T-014 PR-003 error presentation integration tests", () => {
  for (const errorCase of COMMON_UI_ERROR_CASES) {
    it(`3.2/3.6: ${errorCase.status}(${errorCase.code}) の公開エラー表示を統一する`, () => {
      const presentation = resolveIntegratedErrorPresentation(errorCase.status, errorCase.code);

      expect(presentation.status).toBe(errorCase.status);
      expect(presentation.code).toBe(errorCase.code);
      expect(presentation.message).toBe(errorCase.expectedMessage);
      expect(Boolean(presentation.visibleTraceId)).toBe(errorCase.shouldShowTraceId);
    });
  }

  it("500 INTERNAL_ERROR では trace_id が参照可能である", () => {
    const presentation = resolveIntegratedErrorPresentation(500, "INTERNAL_ERROR");

    expect(presentation.statusLabel).toBe("500");
    expect(presentation.traceIdLabel).toBe("trace_id");
    expect(presentation.visibleTraceId).toMatch(/^trace_id:/);
  });

  it("400/403/409 では trace_id を表示しない", () => {
    const statuses: ErrorStatus[] = [400, 403, 409];

    for (const status of statuses) {
      const code: CommonErrorCode = status === 400 ? "VALIDATION_ERROR" : status === 403 ? "FORBIDDEN" : "DOMAIN_CONFLICT";
      const presentation = resolveIntegratedErrorPresentation(status, code);
      expect(presentation.visibleTraceId).toBeNull();
    }
  });

  it("INTERNAL_ERROR(500) でも内部実装詳細は公開しない", () => {
    const presentation = resolveIntegratedErrorPresentation(500, "INTERNAL_ERROR");

    expect(presentation.internalDetail).toBeNull();
  });
});
