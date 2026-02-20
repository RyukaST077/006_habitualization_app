import { describe, expect, it } from "vitest";
import { COMMON_UI_ERROR_CASES } from "../../helpers/fixtures";
import {
  resolveErrorPresentation,
  type CommonErrorCode,
  type ErrorStatus,
} from "../../../src/ui/error-presentation";

describe("T-014 PR-003 error presentation integration tests", () => {
  for (const errorCase of COMMON_UI_ERROR_CASES) {
    it(`3.2/3.6: ${errorCase.status}(${errorCase.code}) の公開エラー表示を統一する`, () => {
      const presentation = resolveErrorPresentation(errorCase.status, errorCase.code);

      expect(presentation.status).toBe(errorCase.status);
      expect(presentation.code).toBe(errorCase.code);
      expect(presentation.message).toBe(errorCase.expectedMessage);
      expect(Boolean(presentation.visibleTraceId)).toBe(errorCase.shouldShowTraceId);
    });
  }

  it("500 INTERNAL_ERROR では trace_id が参照可能である", () => {
    const presentation = resolveErrorPresentation(500, "INTERNAL_ERROR");

    expect(presentation.statusLabel).toBe("500");
    expect(presentation.traceIdLabel).toBe("trace_id");
    expect(presentation.visibleTraceId).toMatch(/^trace_id:/);
  });

  it("400/403/409 では trace_id を表示しない", () => {
    const statuses: ErrorStatus[] = [400, 403, 409];

    for (const status of statuses) {
      const code: CommonErrorCode =
        status === 400
          ? "VALIDATION_ERROR"
          : status === 403
            ? "FORBIDDEN"
            : "DOMAIN_CONFLICT";
      const presentation = resolveErrorPresentation(status, code);
      expect(presentation.visibleTraceId).toBeNull();
    }
  });

  it("INTERNAL_ERROR(500) でも内部実装詳細は公開しない", () => {
    const presentation = resolveErrorPresentation(500, "INTERNAL_ERROR");

    expect(presentation.internalDetail).toBeNull();
  });

  it("SCR-006モック導線の想定でも500以外は trace_id を表示しない", () => {
    const presentation = resolveErrorPresentation(403, "FORBIDDEN", "SCR006-MOCK-403");

    expect(presentation.status).toBe(403);
    expect(presentation.visibleTraceId).toBeNull();
  });
});
