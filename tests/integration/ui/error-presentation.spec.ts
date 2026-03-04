import { describe, expect, it } from "vitest";
import { COMMON_UI_ERROR_CASES, createCommonUiErrorInput } from "../../helpers/fixtures";
import {
  resolveErrorPresentation,
} from "../../../src/ui/error-presentation";

describe("T-014 PR-003 error presentation integration tests", () => {
  for (const errorCase of COMMON_UI_ERROR_CASES) {
    it(`3.2/3.6: ${errorCase.status}(${errorCase.code}) の公開エラー表示を統一する`, () => {
      const input = createCommonUiErrorInput(errorCase.status);
      const presentation = resolveErrorPresentation(input.status, input.code);

      expect(presentation.status).toBe(errorCase.status);
      expect(presentation.code).toBe(errorCase.code);
      expect(presentation.message).toBe(errorCase.expectedMessage);
      expect(Boolean(presentation.visibleTraceId)).toBe(errorCase.shouldShowTraceId);
      expect(presentation.statusLabel).toBe(String(errorCase.status));

      if (errorCase.shouldShowTraceId) {
        expect(presentation.traceIdLabel).toBe("trace_id");
        expect(presentation.visibleTraceId).toMatch(/^trace_id:/);
        return;
      }

      expect(presentation.visibleTraceId).toBeNull();
    });
  }

  it("INTERNAL_ERROR(500) でも内部実装詳細は公開しない", () => {
    const presentation = resolveErrorPresentation(500, "INTERNAL_ERROR");

    expect(presentation.internalDetail).toBeNull();
  });

  it("SCR-006モック導線の想定でも500以外は trace_id を表示しない", () => {
    const presentation = resolveErrorPresentation(403, "FORBIDDEN", "SCR006-MOCK-403");

    expect(presentation.status).toBe(403);
    expect(presentation.visibleTraceId).toBeNull();
  });

  it("409 DOMAIN_CONFLICT のみ再開導線(SCR-004)を表示し、403/500は表示しない", () => {
    const conflict = resolveErrorPresentation(409, "DOMAIN_CONFLICT", "SCR002-CHECKIN-409");
    const forbidden = resolveErrorPresentation(403, "FORBIDDEN", "SCR002-CHECKIN-403");
    const internal = resolveErrorPresentation(500, "INTERNAL_ERROR", "SCR002-CHECKIN-500");

    expect(conflict.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
    expect(forbidden.recoveryAction).toBeNull();
    expect(internal.recoveryAction).toBeNull();
  });

  it("409 DOMAIN_CONFLICT は理由未指定時に既定文言を維持する", () => {
    const conflict = resolveErrorPresentation(409, "DOMAIN_CONFLICT", "SCR002-CHECKIN-409-DEFAULT");

    expect(conflict.message).toBe("現在の状態ではこの操作を完了できません");
    expect(conflict.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });

  it("409 DOMAIN_CONFLICT かつ取消条件違反時は専用文言を表示する", () => {
    const conflict = resolveErrorPresentation(409, "DOMAIN_CONFLICT", "SCR002-CANCEL-409", {
      domainConflictReason: "CHECKIN_CANCEL_NOT_ALLOWED",
    });

    expect(conflict.message).toBe("当日分以外のチェックインは取り消せません");
    expect(conflict.recoveryAction).toEqual({
      label: "再開してチェックインする",
      targetScreenId: "SCR-004",
    });
  });
});
